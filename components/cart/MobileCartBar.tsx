"use client";

import { ShoppingBag } from "lucide-react";
import { cartCount, useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { formatMoney } from "@/lib/money";

/** Sticky bottom cart access on small screens. */
export function MobileCartBar() {
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const openCart = useUi((s) => s.openCart);
  const { totals } = useCartPricing();
  const count = cartCount(lines);
  if (!hydrated || count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <button type="button" onClick={openCart} className="btn btn-dark w-full justify-between shadow-2xl">
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-4" aria-hidden="true" />
          View order · {count}
        </span>
        <span className="tabular-nums">{formatMoney(totals.subtotal)}</span>
      </button>
    </div>
  );
}
