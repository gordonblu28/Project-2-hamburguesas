import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { restaurant } from "@/config/restaurant";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="(draft)">
      <p>By placing an order through this website you agree to these terms. [Business legal name and registration details.]</p>
      <h2>Orders</h2>
      <p>An order is accepted when you receive an order confirmation. Prices and availability may change; the price confirmed at checkout applies to your order.</p>
      <h2>Pricing & taxes</h2>
      <p>All prices are shown in {restaurant.currency}. Taxes and any delivery or service fees are calculated and shown before you place your order.</p>
      <h2>Timing</h2>
      <p>Pickup and delivery times are estimates and are not guaranteed.</p>
      <h2>Allergens</h2>
      <p>Our kitchen handles common allergens. Please contact us before ordering if you have a severe allergy. [Review with the kitchen.]</p>
      <h2>Liability</h2>
      <p>[To be completed by counsel.]</p>
    </LegalPage>
  );
}
