import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { getOrderRepository } from "@/lib/orders/repository";
import { availablePaymentOptions, onlinePaymentMode } from "@/lib/payments";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const { cancelled } = await searchParams;
  const mode = onlinePaymentMode();
  const demoStore = getOrderRepository().isDemo;
  return (
    <>
      <PageHeader eyebrow="Almost there" title="Checkout" />
      <div className="container-x pb-28">
        {cancelled && (
          <p role="status" className="mb-8 rounded-2xl bg-mustard p-4 font-semibold">
            Payment was cancelled. Your cart is still here — you have not been charged.
          </p>
        )}
        {(mode === "demo" || demoStore) && (
          <p className="mb-8 rounded-2xl border-2 border-dashed border-ink/30 p-4 text-sm">
            <strong>Development demo:</strong>{" "}
            {mode === "demo" ? "online payments are not configured (no card will be charged). " : ""}
            Orders are stored locally on this server only and are <strong>not</strong> sent to the restaurant.
          </p>
        )}
        <CheckoutForm paymentOptions={availablePaymentOptions()} />
      </div>
    </>
  );
}
