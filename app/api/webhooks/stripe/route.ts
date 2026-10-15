import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getOrderRepository } from "@/lib/orders/repository";
import { markPaid, markPaymentFailed } from "@/lib/orders/service";
import { stripeClient } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";

/** Stripe webhook: verifies the signature, then updates the order idempotently. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 501 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const repo = getOrderRepository();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (orderId && session.payment_status === "paid") await markPaid(repo, orderId, session.id);
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (orderId) await markPaymentFailed(repo, orderId);
  }
  return NextResponse.json({ received: true });
}
