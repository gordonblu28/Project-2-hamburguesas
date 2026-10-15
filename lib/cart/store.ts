"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { productById } from "@/config/menu";
import { restaurant } from "@/config/restaurant";
import { lineKey, validateSelections } from "@/lib/menu/pricing";
import type { ModifierSelection } from "@/types/product";
import type { FulfillmentType } from "@/types/restaurant";

export interface CartLine {
  key: string;
  productId: string;
  quantity: number;
  selections: ModifierSelection;
  note?: string;
}

interface CartState {
  lines: CartLine[];
  fulfillment: FulfillmentType;
  postalCode: string;
  hydrated: boolean;
  add: (productId: string, selections: ModifierSelection, quantity: number, note?: string) => void;
  /** Replace an existing line (used when editing a customization). */
  replace: (key: string, selections: ModifierSelection, quantity: number, note?: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  setFulfillment: (f: FulfillmentType) => void;
  setPostalCode: (code: string) => void;
}

const clampQty = (q: number) => Math.max(1, Math.min(restaurant.ordering.maxItemQuantity, Math.floor(q)));

export function mergeLine(lines: CartLine[], productId: string, selections: ModifierSelection, quantity: number, note?: string): CartLine[] {
  const key = lineKey(productId, selections, note);
  const existing = lines.find((l) => l.key === key);
  if (existing) return lines.map((l) => (l.key === key ? { ...l, quantity: clampQty(l.quantity + quantity) } : l));
  return [...lines, { key, productId, quantity: clampQty(quantity), selections, note: note?.trim() || undefined }];
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      fulfillment: restaurant.ordering.pickupEnabled ? "pickup" : "delivery",
      postalCode: "",
      hydrated: false,
      add: (productId, selections, quantity, note) => set((s) => ({ lines: mergeLine(s.lines, productId, selections, quantity, note) })),
      replace: (key, selections, quantity, note) =>
        set((s) => {
          const old = s.lines.find((l) => l.key === key);
          if (!old) return s;
          const rest = s.lines.filter((l) => l.key !== key);
          const merged = mergeLine(rest, old.productId, selections, quantity, note);
          // keep the edited line in its original position
          const idx = s.lines.findIndex((l) => l.key === key);
          const newKey = lineKey(old.productId, selections, note);
          const moved = merged.find((l) => l.key === newKey)!;
          const without = merged.filter((l) => l.key !== newKey);
          without.splice(Math.min(idx, without.length), 0, moved);
          return { lines: without };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines: quantity <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, quantity: clampQty(quantity) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
      setPostalCode: (postalCode) => set({ postalCode: postalCode.slice(0, 10) }),
    }),
    {
      name: "stackhouse-cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines, fulfillment: s.fulfillment, postalCode: s.postalCode }),
      // Drop lines whose product or modifiers no longer exist in the menu.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<CartState>;
        const lines = (p.lines ?? []).filter((l) => {
          const product = productById.get(l.productId);
          return product && validateSelections(product, l.selections).ok;
        });
        return { ...current, ...p, lines, hydrated: true };
      },
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
