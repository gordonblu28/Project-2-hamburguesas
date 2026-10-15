"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useId } from "react";
import { useCart } from "@/lib/cart/store";
import { deliveryTerms, findDeliveryZone } from "@/lib/menu/pricing";
import { formatMoney } from "@/lib/money";

/** Postal-code check against the configured (placeholder) delivery zones. */
export function DeliveryCheck() {
  const postalCode = useCart((s) => s.postalCode);
  const setPostalCode = useCart((s) => s.setPostalCode);
  const id = useId();
  const zone = findDeliveryZone(postalCode);
  const terms = deliveryTerms(zone);
  const checked = postalCode.trim().length >= 3;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        Delivery postal code
      </label>
      <input
        id={id}
        className="field mt-1"
        inputMode="text"
        autoComplete="postal-code"
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value)}
        placeholder="e.g. 00000"
        aria-describedby={`${id}-status`}
      />
      <p id={`${id}-status`} aria-live="polite" className="mt-2 text-sm">
        {!checked ? (
          <span className="text-ink-soft">Enter your postal code to check delivery.</span>
        ) : zone ? (
          <span className="flex items-start gap-1.5 text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            We deliver here · {formatMoney(terms.fee)} fee · {formatMoney(terms.minimumOrder)} minimum
          </span>
        ) : (
          <span className="flex items-start gap-1.5 font-semibold text-tomato-ink">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Sorry, that postal code is outside our delivery area. Pickup is available.
          </span>
        )}
      </p>
    </div>
  );
}
