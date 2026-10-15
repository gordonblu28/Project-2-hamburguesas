"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

/** Clears the cart after returning from a successful external payment. */
export function ClearCartOnMount() {
  const hydrated = useCart((s) => s.hydrated);
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);
  return null;
}
