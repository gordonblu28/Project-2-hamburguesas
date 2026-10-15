import "server-only";
import { restaurant } from "@/config/restaurant";
import type { FulfillmentType, PaymentMethodId } from "@/types/restaurant";
import { stripeProvider } from "./stripe";
import type { OnlinePaymentProvider } from "./types";

/** Demo provider: never redirects to a payment page and never claims money was taken. */
const demoProvider: OnlinePaymentProvider = {
  id: "demo",
  isDemo: true,
  async createCheckoutSession() {
    return null;
  },
};

export type OnlineMode = "stripe" | "demo" | "unavailable";

export function onlinePaymentMode(): OnlineMode {
  const online = restaurant.payments.methods.find((m) => m.id === "online");
  if (!online?.enabled) return "unavailable";
  if (restaurant.payments.onlineProvider === "stripe" && process.env.STRIPE_SECRET_KEY) return "stripe";
  // Demo payments are allowed outside production unless explicitly disabled.
  const allowDemo = process.env.ALLOW_DEMO_PAYMENTS
    ? process.env.ALLOW_DEMO_PAYMENTS === "true"
    : process.env.NODE_ENV !== "production";
  return allowDemo ? "demo" : "unavailable";
}

export function getOnlineProvider(): OnlinePaymentProvider | null {
  const mode = onlinePaymentMode();
  if (mode === "stripe") return stripeProvider;
  if (mode === "demo") return demoProvider;
  return null;
}

export interface PaymentOption {
  id: PaymentMethodId;
  label: string;
  description: string;
  fulfillment: FulfillmentType[];
  mode: "live" | "demo" | "in_person";
}

/** Payment methods the customer may actually choose, safe to send to the browser. */
export function availablePaymentOptions(): PaymentOption[] {
  const mode = onlinePaymentMode();
  return restaurant.payments.methods
    .filter((m) => m.enabled)
    .filter((m) => m.id !== "online" || mode !== "unavailable")
    .map((m) => ({
      id: m.id,
      label: m.id === "online" && mode === "demo" ? "Pay online (demo — no card charged)" : m.label,
      description:
        m.id === "online" && mode === "demo"
          ? "Stripe is not configured. The order is recorded locally and no payment is taken."
          : m.description,
      fulfillment: m.fulfillment,
      mode: m.id === "online" ? (mode === "stripe" ? "live" : "demo") : "in_person",
    }));
}
