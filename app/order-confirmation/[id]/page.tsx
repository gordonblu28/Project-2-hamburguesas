import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { TotalsTable } from "@/components/cart/TotalsTable";
import { ClearCartOnMount } from "@/components/checkout/ClearCartOnMount";
import { OrderStatusPoller } from "@/components/checkout/OrderStatusPoller";
import { fullAddress, restaurant } from "@/config/restaurant";
import { formatDayTime } from "@/lib/availability/hours";
import { formatMoney } from "@/lib/money";
import { getOrderRepository } from "@/lib/orders/repository";
import { toPublicOrder } from "@/lib/orders/service";
import { STATUS_LABELS } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAYMENT_LABEL = {
  unpaid: "Not yet paid",
  pending: "Awaiting payment confirmation",
  paid: "Paid online",
  failed: "Payment failed",
  refunded: "Refunded",
  not_required: "No payment required",
} as const;

export default async function ConfirmationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { id } = await params;
  const { paid } = await searchParams;
  if (!UUID.test(id)) notFound();
  const raw = await getOrderRepository().findById(id);
  if (!raw) notFound();
  const order = toPublicOrder(raw);
  const now = new Date();
  const eta = new Date(order.fulfillment.estimatedReadyAt);
  const isPickup = order.fulfillment.type === "pickup";
  const pending = order.status === "pending_payment";
  const failed = order.payment.status === "failed" || order.status === "cancelled";

  const paymentNote =
    order.payment.provider === "demo"
      ? "Demo mode — no payment was taken."
      : order.payment.method === "pay_at_pickup"
        ? "Pay at the counter when you collect."
        : order.payment.method === "pay_on_delivery"
          ? "Pay the driver on delivery."
          : PAYMENT_LABEL[order.payment.status];

  return (
    <div className="pb-28 pt-[calc(var(--header-h)+3rem)]">
      {paid && !failed && <ClearCartOnMount />}
      <OrderStatusPoller active={pending} />
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {order.demo && (
            <div role="note" className="mb-8 flex gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-mustard/40 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p>
                <strong>Development demo order.</strong> This order was saved locally on this server only. It has{" "}
                <strong>not</strong> been sent to the restaurant and no payment was processed. Connect a database, an order
                notification channel and a payment provider before taking real orders.
              </p>
            </div>
          )}
          <p className="eyebrow text-tomato-ink">Order {order.number}</p>
          <h1 className="display mt-4 text-[clamp(3.5rem,9vw,8rem)]">
            {failed ? "Payment didn’t go through" : pending ? "Confirming payment…" : "Order received."}
          </h1>
          <p className="mt-6 max-w-xl text-lg">
            {failed
              ? "Your order was not placed and you have not been charged. Please try again."
              : pending
                ? "We're waiting for confirmation from the payment provider. This page updates automatically."
                : `Thanks, ${order.customer.name.split(" ")[0]}! ${isPickup ? "We'll have it ready for pickup" : "We'll bring it to you"} around ${formatDayTime(eta, now, restaurant, true)} (estimated).`}
          </p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-paper p-5">
              <dt className="eyebrow flex items-center gap-2 text-ink-soft">
                <CheckCircle2 className="size-4" aria-hidden="true" /> Status
              </dt>
              <dd className="mt-2 text-xl font-bold">{STATUS_LABELS[order.status]}</dd>
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <dt className="eyebrow flex items-center gap-2 text-ink-soft">
                <Clock className="size-4" aria-hidden="true" /> {isPickup ? "Pickup" : "Delivery"} time
              </dt>
              <dd className="mt-2 text-xl font-bold">
                {order.fulfillment.requestedTime === "asap" ? "ASAP · " : ""}
                {formatDayTime(eta, now)}
              </dd>
              <dd className="text-xs text-ink-soft">Estimated, not guaranteed.</dd>
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <dt className="eyebrow flex items-center gap-2 text-ink-soft">
                <MapPin className="size-4" aria-hidden="true" /> {isPickup ? "Pickup from" : "Delivering to"}
              </dt>
              <dd className="mt-2">
                {isPickup ? (
                  <>
                    {fullAddress()}
                    <p className="mt-2 text-sm text-ink-soft">{restaurant.location.pickupInstructions}</p>
                  </>
                ) : (
                  <>
                    {order.fulfillment.address?.street}
                    {order.fulfillment.address?.unit ? `, ${order.fulfillment.address.unit}` : ""}
                    <br />
                    {order.fulfillment.address?.city} {order.fulfillment.address?.postalCode}
                  </>
                )}
              </dd>
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <dt className="eyebrow text-ink-soft">Payment</dt>
              <dd className="mt-2 font-bold">{paymentNote}</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/menu" className="btn btn-dark">
              Back to the menu
            </Link>
            <a href={`tel:${restaurant.phone.e164}`} className="btn btn-ghost">
              <Phone className="size-4" aria-hidden="true" /> {restaurant.phone.display}
            </a>
          </div>
          <p className="mt-6 text-sm text-ink-soft">Questions about your order? Call us and mention order {order.number}.</p>
        </div>

        <aside className="lg:col-span-5" aria-labelledby="conf-summary">
          <div className="rounded-[1.5rem] bg-paper p-6 sm:p-8">
            <h2 id="conf-summary" className="display text-4xl">
              Your order
            </h2>
            <ul className="mt-4 divide-y divide-ink/10">
              {order.lines.map((l, i) => (
                <li key={i} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-bold">
                      {l.quantity} × {l.name}
                    </p>
                    {l.modifiers.length > 0 && <p className="text-ink-soft">{l.modifiers.map((m) => m.name).join(" · ")}</p>}
                    {l.note && <p className="italic text-ink-soft">“{l.note}”</p>}
                  </div>
                  <p className="font-bold tabular-nums">{formatMoney(l.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <TotalsTable totals={order.totals} fulfillment={order.fulfillment.type} estimate={false} />
            </div>
            {order.notes && <p className="mt-4 text-sm text-ink-soft">Notes: {order.notes}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
