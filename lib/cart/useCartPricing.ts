"use client";

import { useMemo } from "react";
import { findDeliveryZone, priceCart } from "@/lib/menu/pricing";
import { useCart } from "./store";

/** Client-side estimate using the same pricing module as the server. The server re-prices on checkout. */
export function useCartPricing() {
  const lines = useCart((s) => s.lines);
  const fulfillment = useCart((s) => s.fulfillment);
  const postalCode = useCart((s) => s.postalCode);
  return useMemo(() => {
    const zone = fulfillment === "delivery" ? findDeliveryZone(postalCode) : null;
    const priced = priceCart(lines, fulfillment, zone);
    return { ...priced, zone };
  }, [lines, fulfillment, postalCode]);
}
