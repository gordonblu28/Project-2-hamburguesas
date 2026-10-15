import type { Order } from "@/types/order";

export interface CheckoutSessionResult {
  /** URL the customer must be redirected to in order to pay. */
  redirectUrl: string;
  providerReference: string;
}

export interface OnlinePaymentProvider {
  readonly id: "stripe" | "demo";
  /** True when no real money moves. */
  readonly isDemo: boolean;
  createCheckoutSession(order: Order, siteUrl: string): Promise<CheckoutSessionResult | null>;
}
