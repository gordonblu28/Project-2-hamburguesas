import { restaurant } from "@/config/restaurant";
import { formatMoney } from "@/lib/money";
import type { OrderTotals } from "@/types/order";
import type { FulfillmentType } from "@/types/restaurant";

export function TotalsTable({ totals, fulfillment, estimate = true }: { totals: OrderTotals; fulfillment: FulfillmentType; estimate?: boolean }) {
  const row = "flex justify-between gap-4 py-1";
  return (
    <dl className="text-sm">
      <div className={row}>
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className={row}>
          <dt>Discount</dt>
          <dd className="tabular-nums">−{formatMoney(totals.discount)}</dd>
        </div>
      )}
      {totals.serviceFee > 0 && (
        <div className={row}>
          <dt>{restaurant.fees.serviceFeeLabel}</dt>
          <dd className="tabular-nums">{formatMoney(totals.serviceFee)}</dd>
        </div>
      )}
      {fulfillment === "delivery" && (
        <div className={row}>
          <dt>Delivery fee</dt>
          <dd className="tabular-nums">{formatMoney(totals.deliveryFee)}</dd>
        </div>
      )}
      <div className={row}>
        <dt>{restaurant.tax.label}</dt>
        <dd className="tabular-nums">{formatMoney(totals.tax)}</dd>
      </div>
      <div className="mt-2 flex justify-between gap-4 border-t-2 border-ink pt-3 text-lg font-bold">
        <dt>{estimate ? "Estimated total" : "Total"}</dt>
        <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}
