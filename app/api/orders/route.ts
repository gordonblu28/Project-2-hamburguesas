import { NextResponse } from "next/server";
import { getOrderRepository } from "@/lib/orders/repository";
import { toPublicOrder } from "@/lib/orders/service";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** GET /api/orders?id=<uuid> — read-only order status for the confirmation page. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const order = await getOrderRepository().findById(id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order: toPublicOrder(order) }, { headers: { "Cache-Control": "no-store" } });
}
