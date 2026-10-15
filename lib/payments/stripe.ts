import "server-only";
import Stripe from "stripe";
import { restaurant } from "@/config/restaurant";
import type { Order } from "@/types/order";
import type { OnlinePaymentProvider } from "./types";

let client: Stripe | null = null;
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(key);
  return client;
}

/**
 * Stripe Checkout. Amounts come exclusively from the server-priced order;
 * the order id is used as the Stripe idempotency key so retries never create
 * a second session.
 */
export const stripeProvider: OnlinePaymentProvider = {
  id: "stripe",
  isDemo: false,
  async createCheckoutSession(order: Order, siteUrl: string) {
    const currency = order.currency.toLowerCase();
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency,
        unit_amount: l.unitPrice,
        product_data: {
          name: l.name,
          description: l.modifiers.length ? l.modifiers.map((m) => m.name).join(", ").slice(0, 400) : undefined,
        },
      },
    }));
    const extra = (name: string, amount: number) =>
      amount > 0 && line_items.push({ quantity: 1, price_data: { currency, unit_amount: amount, product_data: { name } } });
    extra("Delivery fee", order.totals.deliveryFee);
    extra(restaurant.fees.serviceFeeLabel, order.totals.serviceFee);
    extra(restaurant.tax.label, order.totals.tax);
    if (order.totals.discount > 0) {
      // Discounts should be modelled as Stripe coupons; refuse rather than charge a wrong amount.
      throw new Error("Discounts are not yet supported with Stripe Checkout");
    }

    const session = await stripeClient().checkout.sessions.create(
      {
        mode: "payment",
        line_items,
        client_reference_id: order.id,
        metadata: { orderId: order.id, orderNumber: order.number },
        customer_email: order.customer.email || undefined,
        success_url: `${siteUrl}/order-confirmation/${order.id}?paid=1`,
        cancel_url: `${siteUrl}/checkout?cancelled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
    if (!session.url) return null;
    return { redirectUrl: session.url, providerReference: session.id };
  },
};
