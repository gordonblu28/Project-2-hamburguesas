import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { restaurant } from "@/config/restaurant";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Ordering & Cancellation Policy", alternates: { canonical: "/ordering-policy" } };

export default function OrderingPolicyPage() {
  return (
    <LegalPage title="Ordering & cancellation" updated="(draft)">
      <h2>Ordering</h2>
      <ul>
        <li>Online ordering is available during opening hours. Orders stop {restaurant.ordering.cutoffMinutesBeforeClose} minutes before closing.</li>
        <li>Scheduled orders can be placed up to {restaurant.ordering.scheduleDaysAhead} days ahead, within opening hours.</li>
        <li>Delivery is available only inside our delivery area, with a minimum order of {formatMoney(restaurant.delivery.minimumOrder)}.</li>
      </ul>
      <h2>Cancellations</h2>
      <p>Because food is cooked to order, please call us as soon as possible at {restaurant.phone.display} if you need to cancel. [Define the cancellation window and any fees.]</p>
      <h2>Problems with your order</h2>
      <p>If something is wrong or missing, contact us the same day with your order number.</p>
    </LegalPage>
  );
}
