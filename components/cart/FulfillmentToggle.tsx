"use client";

import { Bike, ShoppingBag } from "lucide-react";
import { restaurant } from "@/config/restaurant";
import { useCart } from "@/lib/cart/store";
import type { FulfillmentType } from "@/types/restaurant";

const OPTIONS: { id: FulfillmentType; label: string; Icon: typeof Bike; enabled: boolean }[] = [
  { id: "pickup", label: "Pickup", Icon: ShoppingBag, enabled: restaurant.ordering.pickupEnabled },
  { id: "delivery", label: "Delivery", Icon: Bike, enabled: restaurant.ordering.deliveryEnabled },
];

export function FulfillmentToggle({ className = "" }: { className?: string }) {
  const value = useCart((s) => s.fulfillment);
  const set = useCart((s) => s.setFulfillment);
  return (
    <div role="radiogroup" aria-label="Order type" className={`grid grid-cols-2 rounded-full bg-stone p-1 ${className}`}>
      {OPTIONS.map(({ id, label, Icon, enabled }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          disabled={!enabled}
          onClick={() => set(id)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-bold uppercase tracking-wider transition aria-checked:bg-ink aria-checked:text-ivory disabled:opacity-40"
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
          {!enabled && <span className="sr-only">(unavailable)</span>}
        </button>
      ))}
    </div>
  );
}
