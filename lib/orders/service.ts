import "server-only";
import { createHash, randomUUID, randomInt } from "node:crypto";
import { restaurant } from "@/config/restaurant";
import { validateRequestedTime } from "@/lib/availability/hours";
import { formatMoney } from "@/lib/money";
import { deliveryTerms, findDeliveryZone, priceCart } from "@/lib/menu/pricing";
import { availablePaymentOptions } from "@/lib/payments";
import type { OnlinePaymentProvider } from "@/lib/payments/types";
import { checkoutSchema } from "@/lib/validation/checkout";
import type { Order, OrderStatus, PaymentStatus } from "@/types/order";
import type { RestaurantConfig } from "@/types/restaurant";
import type { OrderRepository } from "./repository";
import { canTransition, InvalidTransitionError } from "./status";

export type CreateOrderResult =
  | { ok: true; order: Order; redirectUrl?: string; replayed: boolean }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string> };

export interface OrderDeps {
  repo: OrderRepository;
  provider: OnlinePaymentProvider | null;
  paymentOptions?: ReturnType<typeof availablePaymentOptions>;
  now?: Date;
  siteUrl: string;
  config?: RestaurantConfig;
}

const NUMBER_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function orderNumber() {
  let s = "";
  for (let i = 0; i < 5; i++) s += NUMBER_ALPHABET[randomInt(NUMBER_ALPHABET.length)];
  return `SH-${s}`;
}

function fingerprint(data: unknown) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

/** Serialises concurrent submissions that share an idempotency key within this process. */
const inflight = new Map<string, Promise<CreateOrderResult>>();

export function createOrder(raw: unknown, deps: OrderDeps): Promise<CreateOrderResult> {
  const key =
    raw && typeof raw === "object" && "idempotencyKey" in raw && typeof raw.idempotencyKey === "string"
      ? raw.idempotencyKey
      : null;
  if (!key) return doCreateOrder(raw, deps);
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = doCreateOrder(raw, deps).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function doCreateOrder(raw: unknown, deps: OrderDeps): Promise<CreateOrderResult> {
  const config = deps.config ?? restaurant;
  const now = deps.now ?? new Date();

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, status: 400, error: "Please check the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;
  const fp = fingerprint({ ...input, idempotencyKey: undefined });

  // Idempotency: the same key always resolves to the same order.
  const prior = await deps.repo.findByIdempotencyKey(input.idempotencyKey);
  if (prior) {
    if (prior.fingerprint !== fp) {
      return { ok: false, status: 409, error: "This order was already submitted with different details. Please refresh and try again." };
    }
    return { ok: true, order: prior, replayed: true };
  }

  if (input.fulfillment === "pickup" && !config.ordering.pickupEnabled) {
    return { ok: false, status: 422, error: "Pickup is not available right now." };
  }
  if (input.fulfillment === "delivery" && !config.ordering.deliveryEnabled) {
    return { ok: false, status: 422, error: "Delivery is not available right now." };
  }

  const zone = input.fulfillment === "delivery" ? findDeliveryZone(input.address?.postalCode, config) : null;
  if (input.fulfillment === "delivery" && !zone) {
    return {
      ok: false,
      status: 422,
      error: "Sorry — we don't deliver to that postal code. Pickup is still available.",
      fieldErrors: { "address.postalCode": "Outside our delivery area" },
    };
  }

  const priced = priceCart(input.items, input.fulfillment, zone, config);
  if (!priced.ok) return { ok: false, status: 422, error: priced.errors[0] ?? "Some items are unavailable." };

  if (input.fulfillment === "delivery") {
    const { minimumOrder } = deliveryTerms(zone, config);
    if (priced.totals.subtotal < minimumOrder) {
      return { ok: false, status: 422, error: `Delivery orders need a minimum subtotal of ${formatMoney(minimumOrder, config.locale, config.currency)}.` };
    }
  }

  const time = validateRequestedTime(input.requestedTime, now, input.fulfillment, config);
  if (!time.ok) return { ok: false, status: 422, error: time.reason, fieldErrors: { requestedTime: time.reason } };

  const options = deps.paymentOptions ?? availablePaymentOptions();
  const method = options.find((m) => m.id === input.paymentMethod && m.fulfillment.includes(input.fulfillment));
  if (!method) return { ok: false, status: 422, error: "That payment method isn't available for this order." };

  const isOnline = method.id === "online";
  if (isOnline && !deps.provider) return { ok: false, status: 422, error: "Online payment isn't available right now." };
  const liveOnline = isOnline && deps.provider && !deps.provider.isDemo;

  const status: OrderStatus = liveOnline ? "pending_payment" : "received";
  const paymentStatus: PaymentStatus = liveOnline ? "pending" : "unpaid";
  const stamp = now.toISOString();

  const order: Order = {
    id: randomUUID(),
    number: orderNumber(),
    idempotencyKey: input.idempotencyKey,
    fingerprint: fp,
    createdAt: stamp,
    updatedAt: stamp,
    customer: { name: input.customer.name, phone: input.customer.phone, email: input.customer.email || undefined },
    fulfillment: {
      type: input.fulfillment,
      requestedTime: input.requestedTime,
      estimatedReadyAt: time.readyAt.toISOString(),
      address: input.fulfillment === "delivery" ? input.address : undefined,
      zoneId: zone?.id,
    },
    notes: input.notes || undefined,
    lines: priced.lines,
    totals: priced.totals,
    currency: config.currency,
    payment: {
      method: method.id,
      status: paymentStatus,
      provider: isOnline ? (deps.provider!.id) : "none",
    },
    status,
    statusHistory: [{ status, at: stamp }],
    demo: deps.repo.isDemo || (isOnline && !!deps.provider?.isDemo),
  };

  await deps.repo.create(order);

  if (liveOnline) {
    try {
      const session = await deps.provider!.createCheckoutSession(order, deps.siteUrl);
      if (!session) throw new Error("No checkout session returned");
      const updated = await deps.repo.update(order.id, (o) => ({
        ...o,
        payment: { ...o.payment, providerReference: session.providerReference },
      }));
      return { ok: true, order: updated ?? order, redirectUrl: session.redirectUrl, replayed: false };
    } catch (err) {
      console.error("[checkout] payment session failed for order", order.id, err instanceof Error ? err.message : err);
      await deps.repo.update(order.id, (o) => applyStatus(o, "cancelled", now, "failed"));
      return { ok: false, status: 502, error: "We couldn't start the payment. You have not been charged — please try again." };
    }
  }

  return { ok: true, order, replayed: false };
}

export function applyStatus(order: Order, to: OrderStatus, now = new Date(), payment?: PaymentStatus): Order {
  if (!canTransition(order.status, to, order.fulfillment.type)) throw new InvalidTransitionError(order.status, to);
  const at = now.toISOString();
  return {
    ...order,
    status: to,
    updatedAt: at,
    statusHistory: [...order.statusHistory, { status: to, at }],
    payment: payment ? { ...order.payment, status: payment } : order.payment,
  };
}

/** Idempotent: marks a pending order paid. Repeated webhook deliveries are no-ops. */
export async function markPaid(repo: OrderRepository, orderId: string, providerReference: string, now = new Date()) {
  return repo.update(orderId, (o) => {
    if (o.payment.status === "paid") return o;
    if (o.payment.providerReference && o.payment.providerReference !== providerReference) return o;
    const next = o.status === "pending_payment" ? applyStatus(o, "received", now, "paid") : o;
    return { ...next, payment: { ...next.payment, status: "paid", providerReference } };
  });
}

export async function markPaymentFailed(repo: OrderRepository, orderId: string, now = new Date()) {
  return repo.update(orderId, (o) => {
    if (o.payment.status === "paid" || o.status !== "pending_payment") return o;
    return applyStatus(o, "cancelled", now, "failed");
  });
}

/** Fields safe to show on the confirmation page / API. */
export function toPublicOrder(order: Order) {
  const { idempotencyKey: _k, fingerprint: _f, ...rest } = order;
  void _k;
  void _f;
  const digits = order.customer.phone.replace(/\D/g, "");
  return {
    ...rest,
    customer: { name: order.customer.name, phoneLast4: digits.slice(-4), hasEmail: Boolean(order.customer.email) },
  };
}
export type PublicOrder = ReturnType<typeof toPublicOrder>;
