"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { productById } from "@/config/menu";
import { restaurant } from "@/config/restaurant";
import { ProductVisual } from "@/components/art/ProductVisual";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { cartCount, useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { deliveryTerms, priceLine } from "@/lib/menu/pricing";
import { formatMoney } from "@/lib/money";
import { QuantityStepper } from "@/components/menu/QuantityStepper";
import { DeliveryCheck } from "./DeliveryCheck";
import { FulfillmentToggle } from "./FulfillmentToggle";
import { TotalsTable } from "./TotalsTable";

export function CartDrawer() {
  const open = useUi((s) => s.cartOpen);
  const close = useUi((s) => s.closeCart);
  return (
    <Sheet open={open} onClose={close} label="Your order">
      <CartContents onClose={close} />
    </Sheet>
  );
}

export function CartContents({ onClose }: { onClose?: () => void }) {
  const lines = useCart((s) => s.lines);
  const fulfillment = useCart((s) => s.fulfillment);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const openCustomizer = useUi((s) => s.openCustomizer);
  const pricing = useCartPricing();
  const [confirmClear, setConfirmClear] = useState(false);
  const count = cartCount(lines);

  const zone = pricing.zone;
  const minimum = deliveryTerms(zone).minimumOrder;
  const deliveryBlocked = fulfillment === "delivery" && (!zone || pricing.totals.subtotal < minimum);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <h2 className="display text-4xl">
          Your order <span className="align-top font-sans text-base font-bold text-ink-soft">({count})</span>
        </h2>
        {onClose && <SheetClose onClose={onClose} label="Close cart" />}
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <ProductVisual image={{ art: "burger-smash", alt: "" }} className="w-40 opacity-90" />
          <div>
            <p className="display text-4xl">Nothing stacked yet</p>
            <p className="mt-2 text-ink-soft">Your cart is empty. The grill is not.</p>
          </div>
          <Link href="/order" onClick={onClose} className="btn btn-primary">
            Start an order
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
            <FulfillmentToggle />
            {fulfillment === "delivery" && <DeliveryCheck />}

            <ul className="divide-y divide-ink/10">
              {lines.map((line) => {
                const product = productById.get(line.productId);
                const priced = priceLine(line);
                if (!product) return null;
                return (
                  <li key={line.key} className="flex gap-4 py-4">
                    <ProductVisual image={product.image} className="size-20 shrink-0 rounded-xl bg-stone p-2" sizes="80px" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold leading-tight">{product.name}</p>
                        <p className="font-bold tabular-nums">{priced.ok ? formatMoney(priced.line.lineTotal) : "—"}</p>
                      </div>
                      {priced.ok && priced.line.modifiers.length > 0 && (
                        <p className="mt-1 text-sm text-ink-soft">{priced.line.modifiers.map((m) => m.name).join(" · ")}</p>
                      )}
                      {line.note && <p className="mt-1 text-sm italic text-ink-soft">“{line.note}”</p>}
                      {!priced.ok && (
                        <p role="alert" className="mt-1 text-sm font-semibold text-tomato-ink">
                          {priced.error} Please remove it to continue.
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <QuantityStepper
                          size="sm"
                          min={0}
                          value={line.quantity}
                          max={restaurant.ordering.maxItemQuantity}
                          onChange={(q) => setQuantity(line.key, q)}
                          label={`Quantity of ${product.name}`}
                        />
                        {product.modifierGroups.length > 0 && product.available && (
                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded-full hover:bg-stone"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => {
                              onClose?.();
                              openCustomizer(product.id, line.key);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="grid size-9 place-items-center rounded-full hover:bg-stone"
                          aria-label={`Remove ${product.name}`}
                          onClick={() => remove(line.key)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="text-sm">
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-stone p-3" role="alertdialog" aria-label="Confirm clear cart">
                  <span className="font-semibold">Remove everything from your cart?</span>
                  <button
                    type="button"
                    className="rounded-full bg-tomato px-4 py-2 font-bold text-paper"
                    onClick={() => {
                      clear();
                      setConfirmClear(false);
                    }}
                  >
                    Yes, clear
                  </button>
                  <button type="button" className="rounded-full px-4 py-2 font-bold ring-2 ring-ink" onClick={() => setConfirmClear(false)}>
                    Keep items
                  </button>
                </div>
              ) : (
                <button type="button" className="link-underline font-semibold text-ink-soft" onClick={() => setConfirmClear(true)}>
                  Clear cart
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t border-ink/10 bg-paper px-5 py-5">
            <TotalsTable totals={pricing.totals} fulfillment={fulfillment} />
            {fulfillment === "delivery" && zone && pricing.totals.subtotal < minimum && (
              <p className="text-sm font-semibold text-tomato-ink">
                Add {formatMoney(minimum - pricing.totals.subtotal)} more to reach the {formatMoney(minimum)} delivery minimum.
              </p>
            )}
            {!pricing.ok ? (
              <button type="button" className="btn btn-primary w-full" disabled>
                Remove unavailable items to continue
              </button>
            ) : deliveryBlocked ? (
              <button type="button" className="btn btn-primary w-full" disabled>
                {zone ? "Below delivery minimum" : "Check delivery postal code"}
              </button>
            ) : (
              <Link href="/checkout" onClick={onClose} className="btn btn-primary w-full justify-between">
                <span>Checkout</span>
                <span className="tabular-nums">{formatMoney(pricing.totals.total)}</span>
              </Link>
            )}
            <p className="text-center text-xs text-ink-soft">Final total is confirmed at checkout.</p>
          </div>
        </>
      )}
    </div>
  );
}
