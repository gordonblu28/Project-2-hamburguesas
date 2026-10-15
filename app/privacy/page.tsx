import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { restaurant } from "@/config/restaurant";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="(draft)">
      <p>This policy explains what personal information {restaurant.name} collects when you use this website and how it is used.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Order details: your name, phone number, optional email address, and delivery address if you choose delivery.</li>
        <li>Your cart contents, stored in your own browser (local storage) so it survives page refreshes.</li>
        <li>Payment information is entered directly with our payment provider. We never receive or store full card numbers or security codes.</li>
        <li>Basic technical logs (such as IP address) used to protect the ordering system from abuse.</li>
      </ul>
      <h2>How we use it</h2>
      <p>Only to prepare, deliver and support your order, to contact you about that order, and to keep the service secure.</p>
      <h2>Sharing</h2>
      <p>We share data only with service providers needed to process your order (for example, the payment processor or delivery partner). [List providers here.]</p>
      <h2>Retention & your choices</h2>
      <p>[Describe how long order records are kept and how customers can request access or deletion.]</p>
      <h2>Contact</h2>
      <p>
        Questions? Email <a className="underline" href={`mailto:${restaurant.email}`}>{restaurant.email}</a>.
      </p>
    </LegalPage>
  );
}
