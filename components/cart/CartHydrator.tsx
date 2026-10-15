"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/store";

/** Rehydrates the persisted cart after mount and keeps tabs in sync. */
export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === useCart.persist.getOptions().name) void useCart.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
