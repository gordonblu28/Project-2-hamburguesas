import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { restaurant } from "@/config/restaurant";

export const metadata: Metadata = { title: "Refund Policy", alternates: { canonical: "/refund-policy" } };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refunds" updated="(draft)">
      <p>If your order is incorrect, incomplete or not up to standard, contact us at {restaurant.phone.display} or {restaurant.email} with your order number.</p>
      <h2>Online payments</h2>
      <p>Approved refunds for online payments are returned to the original payment method. [State processing times.]</p>
      <h2>In-person payments</h2>
      <p>[Describe how refunds for pay-at-pickup orders are handled.]</p>
    </LegalPage>
  );
}
