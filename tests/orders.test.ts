import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { productById } from "@/config/menu";
import { getSlots } from "@/lib/availability/hours";
import { defaultSelections } from "@/lib/menu/pricing";
import { MemoryOrderRepository } from "@/lib/orders/repository";
import { applyStatus, createOrder, markPaid, markPaymentFailed, toPublicOrder, type OrderDeps } from "@/lib/orders/service";
import { canTransition } from "@/lib/orders/status";
import type { OnlinePaymentProvider } from "@/lib/payments/types";
import type { PaymentOption } from "@/lib/payments";
import { OPEN_THU_NOON, testConfig } from "./helpers";

const house = productById.get("p_house_stack")!;
const config = testConfig();

const options: PaymentOption[] = [
  { id: "online", label: "Pay online", description: "", fulfillment: ["pickup", "delivery"], mode: "live" },
  { id: "pay_at_pickup", label: "Pay at pickup", description: "", fulfillment: ["pickup"], mode: "in_person" },
];

function payload(overrides: Record<string, unknown> = {}) {
  return {
    idempotencyKey: randomUUID(),
    fulfillment: "pickup",
    requestedTime: "asap",
    customer: { name: "Jamie Doe", phone: "(555) 010-0100", email: "" },
    paymentMethod: "pay_at_pickup",
    items: [{ productId: house.id, quantity: 2, selections: { ...defaultSelections(house), extras: ["bacon"] } }],
    acceptTerms: true,
    ...overrides,
  };
}

let repo: MemoryOrderRepository;
let deps: OrderDeps;

beforeEach(() => {
  repo = new MemoryOrderRepository();
  deps = { repo, provider: null, paymentOptions: options, now: OPEN_THU_NOON, siteUrl: "http://test", config };
});

describe("createOrder", () => {
  it("creates a pickup order priced on the server", async () => {
    const r = await createOrder(payload(), deps);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.status).toBe("received");
    expect(r.order.payment.status).toBe("unpaid");
    expect(r.order.totals.subtotal).toBe((1295 + 250) * 2);
    expect(r.order.totals.deliveryFee).toBe(0);
    expect(r.order.totals.total).toBe(r.order.totals.subtotal + r.order.totals.tax);
    expect(r.order.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.order.demo).toBe(true); // memory store is a demo store
  });

  it("ignores any prices or totals sent by the browser", async () => {
    const p = payload({ total: 1, subtotal: 1 });
    (p.items[0] as Record<string, unknown>).price = 1;
    const r = await createOrder(p, deps);
    expect(r.ok && r.order.totals.subtotal).toBe((1295 + 250) * 2);
  });

  it("returns field errors for invalid customer information", async () => {
    const r = await createOrder(payload({ customer: { name: "J", phone: "abc" }, acceptTerms: false }), deps);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(400);
    expect(r.fieldErrors?.["customer.name"]).toBeTruthy();
    expect(r.fieldErrors?.["customer.phone"]).toBeTruthy();
    expect(r.fieldErrors?.acceptTerms).toBeTruthy();
  });

  it("requires an address for delivery", async () => {
    const r = await createOrder(payload({ fulfillment: "delivery", paymentMethod: "online" }), deps);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fieldErrors?.address).toBeTruthy();
  });

  it("is idempotent: the same key returns the same order", async () => {
    const p = payload();
    const [a, b] = await Promise.all([createOrder(p, deps), createOrder(p, deps)]);
    const c = await createOrder(p, deps);
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;
    expect(b.order.id).toBe(a.order.id);
    expect(c.order.id).toBe(a.order.id);
    expect(c.replayed).toBe(true);
  });

  it("rejects a reused key with a different payload", async () => {
    const p = payload();
    await createOrder(p, deps);
    const r = await createOrder({ ...p, notes: "changed" }, deps);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(409);
  });

  it("rejects unavailable products", async () => {
    const r = await createOrder(payload({ items: [{ productId: "p_garden_stack", quantity: 1, selections: {} }] }), deps);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/unavailable/i);
  });

  it("rejects invalid modifier combinations", async () => {
    const r = await createOrder(payload({ items: [{ productId: house.id, quantity: 1, selections: { ...defaultSelections(house), extras: ["avocado"] } }] }), deps);
    expect(r.ok).toBe(false);
  });

  it("rejects ASAP orders while the restaurant is closed but accepts scheduled ones", async () => {
    const closed = new Date("2026-10-19T17:00:00Z"); // Monday
    const asap = await createOrder(payload(), { ...deps, now: closed });
    expect(asap.ok).toBe(false);
    if (!asap.ok) expect(asap.status).toBe(422);
    const slot = getSlots(closed, "pickup", config)[0]!;
    const scheduled = await createOrder(payload({ requestedTime: slot.toISOString() }), { ...deps, now: closed });
    expect(scheduled.ok).toBe(true);
  });

  it("validates delivery zone and minimum order", async () => {
    const address = { street: "1 Test St", city: "Your City", postalCode: "99999" };
    const out = await createOrder(payload({ fulfillment: "delivery", address, paymentMethod: "online" }), { ...deps, provider: demoProvider });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.fieldErrors?.["address.postalCode"]).toBeTruthy();

    const small = await createOrder(
      payload({ fulfillment: "delivery", address: { ...address, postalCode: "00010" }, paymentMethod: "online", items: [{ productId: "p_fries", quantity: 1, selections: defaultSelections(productById.get("p_fries")!) }] }),
      { ...deps, provider: demoProvider },
    );
    expect(small.ok).toBe(false);
    if (!small.ok) expect(small.error).toMatch(/minimum/i);

    const ok = await createOrder(payload({ fulfillment: "delivery", address: { ...address, postalCode: "00000" }, paymentMethod: "online" }), { ...deps, provider: demoProvider });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.order.totals.deliveryFee).toBe(config.delivery.fee);
      expect(ok.order.payment.provider).toBe("demo");
      expect(ok.order.payment.status).toBe("unpaid");
    }
  });

  it("rejects payment methods not offered for the fulfillment type", async () => {
    const address = { street: "1 Test St", city: "Your City", postalCode: "00000" };
    const r = await createOrder(payload({ fulfillment: "delivery", address, paymentMethod: "pay_at_pickup" }), deps);
    expect(r.ok).toBe(false);
  });

  it("creates a pending order and payment session for live online payments", async () => {
    const provider: OnlinePaymentProvider = {
      id: "stripe",
      isDemo: false,
      createCheckoutSession: vi.fn(async () => ({ redirectUrl: "https://pay.example/session", providerReference: "cs_123" })),
    };
    const r = await createOrder(payload({ paymentMethod: "online" }), { ...deps, provider });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.redirectUrl).toBe("https://pay.example/session");
    expect(r.order.status).toBe("pending_payment");
    expect(r.order.payment.providerReference).toBe("cs_123");

    // webhook → paid (idempotent)
    await markPaid(repo, r.order.id, "cs_123");
    const again = await markPaid(repo, r.order.id, "cs_123");
    expect(again?.status).toBe("received");
    expect(again?.payment.status).toBe("paid");
    expect(again?.statusHistory.filter((h) => h.status === "received")).toHaveLength(1);
  });

  it("cancels the order if the payment session cannot be created", async () => {
    const provider: OnlinePaymentProvider = { id: "stripe", isDemo: false, createCheckoutSession: async () => { throw new Error("boom"); } };
    const r = await createOrder(payload({ paymentMethod: "online" }), { ...deps, provider });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(502);
  });

  it("strips internal fields from the public view", async () => {
    const r = await createOrder(payload(), deps);
    if (!r.ok) throw new Error("expected ok");
    const pub = toPublicOrder(r.order);
    expect(pub).not.toHaveProperty("idempotencyKey");
    expect(pub).not.toHaveProperty("fingerprint");
    expect(pub.customer).toEqual({ name: "Jamie Doe", phoneLast4: "0100", hasEmail: false });
  });
});

describe("order status rules", () => {
  it("only allows valid transitions", () => {
    expect(canTransition("received", "confirmed", "pickup")).toBe(true);
    expect(canTransition("preparing", "ready_for_pickup", "pickup")).toBe(true);
    expect(canTransition("preparing", "ready_for_pickup", "delivery")).toBe(false);
    expect(canTransition("preparing", "out_for_delivery", "delivery")).toBe(true);
    expect(canTransition("completed", "preparing", "pickup")).toBe(false);
    expect(canTransition("cancelled", "received", "pickup")).toBe(false);
    expect(canTransition("received", "completed", "pickup")).toBe(false);
  });

  it("throws on invalid transitions and records history", async () => {
    const r = await createOrder(payload(), deps);
    if (!r.ok) throw new Error("expected ok");
    expect(() => applyStatus(r.order, "completed")).toThrow();
    const next = applyStatus(r.order, "confirmed");
    expect(next.statusHistory.map((h) => h.status)).toEqual(["received", "confirmed"]);
  });

  it("does not cancel an already paid order on a late failure event", async () => {
    const provider: OnlinePaymentProvider = { id: "stripe", isDemo: false, createCheckoutSession: async () => ({ redirectUrl: "https://x", providerReference: "cs_1" }) };
    const r = await createOrder(payload({ paymentMethod: "online" }), { ...deps, provider });
    if (!r.ok) throw new Error("expected ok");
    await markPaid(repo, r.order.id, "cs_1");
    const after = await markPaymentFailed(repo, r.order.id);
    expect(after?.status).toBe("received");
  });
});

const demoProvider: OnlinePaymentProvider = { id: "demo", isDemo: true, createCheckoutSession: async () => null };
