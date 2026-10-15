"use client";

import { Plus } from "lucide-react";
import { productById } from "@/config/menu";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";
import { defaultSelections } from "@/lib/menu/pricing";

export function AddToOrderButton({
  productId,
  variant = "icon",
  className = "",
  label,
}: {
  productId: string;
  variant?: "icon" | "pill" | "primary";
  className?: string;
  label?: string;
}) {
  const product = productById.get(productId);
  const openCustomizer = useUi((s) => s.openCustomizer);
  const notify = useUi((s) => s.notify);
  const add = useCart((s) => s.add);
  if (!product) return null;

  const onClick = () => {
    if (product.modifierGroups.length === 0) {
      add(product.id, defaultSelections(product), 1);
      notify(`${product.name} added`);
    } else {
      openCustomizer(product.id);
    }
  };

  if (!product.available) {
    return (
      <span className={`eyebrow inline-flex min-h-11 items-center rounded-full bg-stone px-4 text-ink-soft ${className}`}>Sold out</span>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Add ${product.name} to order`}
        className={`grid size-12 shrink-0 place-items-center rounded-full bg-ink text-ivory transition hover:rotate-90 hover:bg-tomato ${className}`}
      >
        <Plus className="size-5" aria-hidden="true" />
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`btn ${variant === "primary" ? "btn-primary" : "btn-dark"} ${className}`}>
      {label ?? "Add to order"}
      <Plus className="size-4" aria-hidden="true" />
    </button>
  );
}
