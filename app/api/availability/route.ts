import { NextResponse } from "next/server";
import { restaurant } from "@/config/restaurant";
import { getSlots, getStatus, leadMinutes } from "@/lib/availability/hours";
import { deliveryTerms, findDeliveryZone } from "@/lib/menu/pricing";

export const dynamic = "force-dynamic";

/** GET /api/availability?fulfillment=pickup|delivery&postalCode=00000 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fulfillment = url.searchParams.get("fulfillment") === "delivery" ? "delivery" : "pickup";
  const postalCode = url.searchParams.get("postalCode")?.slice(0, 12) ?? "";
  const now = new Date();
  const status = getStatus(now, restaurant);
  const zone = postalCode ? findDeliveryZone(postalCode) : null;
  const enabled = fulfillment === "pickup" ? restaurant.ordering.pickupEnabled : restaurant.ordering.deliveryEnabled;

  return NextResponse.json(
    {
      now: now.toISOString(),
      status: {
        state: status.state,
        headline: status.headline,
        detail: status.detail ?? null,
        acceptingAsap: status.acceptingAsap && enabled,
        nextOpen: status.next?.start.toISOString() ?? null,
      },
      fulfillment,
      enabled,
      leadMinutes: leadMinutes(fulfillment),
      slots: enabled ? getSlots(now, fulfillment).map((d) => d.toISOString()) : [],
      delivery:
        fulfillment === "delivery" && postalCode
          ? { postalCode, available: Boolean(zone), zone: zone?.name ?? null, ...deliveryTerms(zone) }
          : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
