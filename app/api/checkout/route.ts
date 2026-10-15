import { NextResponse } from "next/server";
import { siteUrl } from "@/config/restaurant";
import { getOrderRepository } from "@/lib/orders/repository";
import { createOrder, toPublicOrder } from "@/lib/orders/service";
import { getOnlineProvider } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limit = rateLimit(`checkout:${clientIp(req.headers)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64_000) return NextResponse.json({ error: "Request too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await createOrder(body, {
      repo: getOrderRepository(),
      provider: getOnlineProvider(),
      siteUrl,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error, fieldErrors: result.fieldErrors }, { status: result.status });
    }
    return NextResponse.json({
      order: toPublicOrder(result.order),
      redirectUrl: result.redirectUrl ?? `/order-confirmation/${result.order.id}`,
      replayed: result.replayed,
    });
  } catch (err) {
    console.error("[checkout] unexpected error", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong on our side. Your order was not placed." }, { status: 500 });
  }
}
