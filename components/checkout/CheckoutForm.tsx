"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { productById } from "@/config/menu";
import { restaurant } from "@/config/restaurant";
import { FulfillmentToggle } from "@/components/cart/FulfillmentToggle";
import { TotalsTable } from "@/components/cart/TotalsTable";
import { ProductVisual } from "@/components/art/ProductVisual";
import { useCart } from "@/lib/cart/store";
import { useCartPricing } from "@/lib/cart/useCartPricing";
import { deliveryTerms } from "@/lib/menu/pricing";
import { formatMoney } from "@/lib/money";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validation/checkout";
import type { PaymentMethodId } from "@/types/restaurant";
import { useAvailability } from "./useAvailability";

export interface ClientPaymentOption {
  id: PaymentMethodId;
  label: string;
  description: string;
  fulfillment: ("pickup" | "delivery")[];
  mode: "live" | "demo" | "in_person";
}

const SERVER_FIELD_MAP: Record<string, FieldPath<CheckoutFormValues>> = {
  "customer.name": "name",
  "customer.phone": "phone",
  "customer.email": "email",
  "address.street": "street",
  "address.city": "city",
  "address.postalCode": "postalCode",
  "address.unit": "unit",
  "address.instructions": "instructions",
  requestedTime: "requestedTime",
  notes: "notes",
  paymentMethod: "paymentMethod",
  acceptTerms: "acceptTerms",
};

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-tomato-ink">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ paymentOptions }: { paymentOptions: ClientPaymentOption[] }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hydrated = useCart((s) => s.hydrated);
  const fulfillment = useCart((s) => s.fulfillment);
  const postalCode = useCart((s) => s.postalCode);
  const setPostalCode = useCart((s) => s.setPostalCode);
  const clearCart = useCart((s) => s.clear);
  const pricing = useCartPricing();
  const { data: availability, error: availabilityError, refresh } = useAvailability(fulfillment);

  const methods = useMemo(() => paymentOptions.filter((m) => m.fulfillment.includes(fulfillment)), [paymentOptions, fulfillment]);
  const idempotencyKey = useRef<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: {
      fulfillment,
      requestedTime: "",
      name: "",
      phone: "",
      email: "",
      street: "",
      unit: "",
      city: restaurant.address.city,
      postalCode,
      instructions: "",
      notes: "",
      paymentMethod: methods[0]?.id ?? "online",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
  }, []);

  useEffect(() => setValue("fulfillment", fulfillment), [fulfillment, setValue]);
  // The persisted cart hydrates after the first render; copy the saved postal code into the form once.
  const syncedPostal = useRef(false);
  useEffect(() => {
    if (hydrated && !syncedPostal.current) {
      syncedPostal.current = true;
      if (postalCode) setValue("postalCode", postalCode);
    }
  }, [hydrated, postalCode, setValue]);
  useEffect(() => {
    const current = getValues("paymentMethod");
    if (!methods.some((m) => m.id === current) && methods[0]) setValue("paymentMethod", methods[0].id);
  }, [methods, setValue, getValues]);

  // Default the time selector to ASAP or the first slot whenever availability changes.
  const requestedTime = useWatch({ control, name: "requestedTime" });
  useEffect(() => {
    if (!availability) return;
    const valid = requestedTime === "asap" ? availability.status.acceptingAsap : availability.slots.includes(requestedTime);
    if (!valid) setValue("requestedTime", availability.status.acceptingAsap ? "asap" : (availability.slots[0] ?? ""));
  }, [availability, requestedTime, setValue]);

  const slotGroups = useMemo(() => {
    const groups = new Map<string, { value: string; label: string }[]>();
    const dayFmt = new Intl.DateTimeFormat(restaurant.locale, { weekday: "long", month: "short", day: "numeric", timeZone: restaurant.timeZone });
    const timeFmt = new Intl.DateTimeFormat(restaurant.locale, { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: restaurant.timeZone });
    for (const s of availability?.slots ?? []) {
      const d = new Date(s);
      const day = dayFmt.format(d);
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day)!.push({ value: s, label: timeFmt.format(d) });
    }
    return [...groups.entries()];
  }, [availability]);

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-3xl bg-stone" aria-busy="true" aria-label="Loading your cart" />;
  }

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="display text-6xl">Your cart is empty</p>
        <p className="mt-3 text-ink-soft">Add something delicious before checking out.</p>
        <Link href="/order" className="btn btn-primary mt-8">
          Browse the menu
        </Link>
      </div>
    );
  }

  const zone = pricing.zone;
  const minimum = deliveryTerms(zone).minimumOrder;
  const deliveryProblem =
    fulfillment === "delivery"
      ? !postalCode.trim()
        ? null
        : !zone
          ? "We don't deliver to that postal code. Switch to pickup or try another address."
          : pricing.totals.subtotal < minimum
            ? `Delivery orders need a ${formatMoney(minimum)} minimum subtotal. Add ${formatMoney(minimum - pricing.totals.subtotal)} more.`
            : null
      : null;

  const noTimes = availability && !availability.status.acceptingAsap && availability.slots.length === 0;
  const blocked = !pricing.ok || Boolean(deliveryProblem) || Boolean(noTimes) || methods.length === 0 || !availability;

  const onSubmit = async (values: CheckoutFormValues) => {
    if (submitting || blocked) return;
    setSubmitting(true);
    setFormError(null);
    const payload = {
      idempotencyKey: idempotencyKey.current,
      fulfillment,
      requestedTime: values.requestedTime,
      customer: { name: values.name, phone: values.phone, email: values.email || undefined },
      address:
        fulfillment === "delivery"
          ? { street: values.street, unit: values.unit || undefined, city: values.city, postalCode: values.postalCode, instructions: values.instructions || undefined }
          : undefined,
      notes: values.notes || undefined,
      paymentMethod: values.paymentMethod,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, selections: l.selections, note: l.note })),
      acceptTerms: values.acceptTerms,
    };
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string>; redirectUrl?: string };
      if (!res.ok || !body.redirectUrl) {
        // The server rejected the request, so nothing was created: next attempt gets a fresh key.
        if (res.status >= 400 && res.status < 500) idempotencyKey.current = crypto.randomUUID();
        for (const [k, msg] of Object.entries(body.fieldErrors ?? {})) {
          const field = SERVER_FIELD_MAP[k];
          if (field) setError(field, { message: msg });
        }
        if (body.fieldErrors?.requestedTime) refresh();
        setFormError(body.error ?? "We couldn't place your order. Please try again.");
        setSubmitting(false);
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
      if (/^https?:\/\//.test(body.redirectUrl)) {
        // External payment page (Stripe). Keep the cart until payment is confirmed.
        window.location.assign(body.redirectUrl);
        return;
      }
      clearCart();
      router.push(body.redirectUrl);
    } catch {
      // Network failure: keep the same key so a retry can't create a duplicate order.
      setFormError("Connection problem — your order may not have been placed. Please try again; you won't be charged twice.");
      setSubmitting(false);
    }
  };

  const err = (k: keyof CheckoutFormValues) => errors[k]?.message as string | undefined;
  const aria = (k: keyof CheckoutFormValues, id: string) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${id}-error` : undefined,
  });

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="grid gap-10 lg:grid-cols-12" aria-label="Checkout">
      <div className="space-y-12 lg:col-span-7">
        {formError && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-2xl bg-tomato p-4 font-semibold text-paper">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> {formError}
          </div>
        )}

        <section aria-labelledby="co-type" className="space-y-5">
          <h2 id="co-type" className="display text-4xl">
            1. Pickup or delivery
          </h2>
          <FulfillmentToggle className="max-w-md" />
          {fulfillment === "pickup" && (
            <p className="text-ink-soft">
              Pickup from <strong className="text-ink">{restaurant.address.street}</strong>. {restaurant.location.pickupInstructions}
            </p>
          )}
        </section>

        <section aria-labelledby="co-time" className="space-y-4">
          <h2 id="co-time" className="display text-4xl">
            2. When
          </h2>
          {availabilityError && <p role="alert" className="font-semibold text-tomato-ink">{availabilityError}</p>}
          {!availability && !availabilityError && <div className="h-12 animate-pulse rounded-lg bg-stone" aria-label="Loading times" />}
          {availability && (
            <>
              <p className="text-sm font-semibold">{availability.status.headline}</p>
              {noTimes ? (
                <p role="alert" className="rounded-xl bg-stone p-4">
                  We&rsquo;re not taking {fulfillment} orders right now and there are no scheduled times available.
                  {availability.status.nextOpen && <> We next open {new Intl.DateTimeFormat(restaurant.locale, { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: restaurant.timeZone }).format(new Date(availability.status.nextOpen))}.</>}
                </p>
              ) : (
                <Field id="requestedTime" label={fulfillment === "pickup" ? "Pickup time" : "Delivery time"} error={err("requestedTime")} hint={fulfillment === "delivery" ? "Delivery times are estimates, not guarantees." : "Ready times are estimates."}>
                  <select id="requestedTime" className="field" {...register("requestedTime")} {...aria("requestedTime", "requestedTime")}>
                    {availability.status.acceptingAsap && (
                      <option value="asap">ASAP — about {availability.leadMinutes} min</option>
                    )}
                    {slotGroups.map(([day, slots]) => (
                      <optgroup key={day} label={day}>
                        {slots.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="co-details" className="space-y-5">
          <h2 id="co-details" className="display text-4xl">
            3. Your details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="name" label="Full name" error={err("name")}>
                <input id="name" className="field" autoComplete="name" {...register("name")} {...aria("name", "name")} />
              </Field>
            </div>
            <Field id="phone" label="Phone" error={err("phone")} hint="Only used about this order.">
              <input id="phone" type="tel" inputMode="tel" className="field" autoComplete="tel" {...register("phone")} {...aria("phone", "phone")} />
            </Field>
            <Field id="email" label="Email (optional)" error={err("email")} hint="For your receipt.">
              <input id="email" type="email" inputMode="email" className="field" autoComplete="email" {...register("email")} {...aria("email", "email")} />
            </Field>
          </div>

          {fulfillment === "delivery" && (
            <fieldset className="grid gap-5 sm:grid-cols-6">
              <legend className="mb-3 text-lg font-bold">Delivery address</legend>
              <div className="sm:col-span-4">
                <Field id="street" label="Street address" error={err("street")}>
                  <input id="street" className="field" autoComplete="address-line1" {...register("street")} {...aria("street", "street")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="unit" label="Apt / unit" error={err("unit")}>
                  <input id="unit" className="field" autoComplete="address-line2" {...register("unit")} />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field id="city" label="City" error={err("city")}>
                  <input id="city" className="field" autoComplete="address-level2" {...register("city")} {...aria("city", "city")} />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field id="postalCode" label="Postal code" error={err("postalCode") ?? (deliveryProblem && !zone ? "Outside our delivery area" : undefined)}>
                  <input
                    id="postalCode"
                    className="field"
                    autoComplete="postal-code"
                    {...register("postalCode", { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPostalCode(e.target.value) })}
                    {...aria("postalCode", "postalCode")}
                  />
                </Field>
              </div>
              <div className="sm:col-span-6">
                <Field id="instructions" label="Delivery instructions (optional)" error={err("instructions")}>
                  <input id="instructions" className="field" placeholder="Gate code, buzzer, leave at door…" {...register("instructions")} />
                </Field>
              </div>
            </fieldset>
          )}
          {deliveryProblem && (
            <p role="alert" className="rounded-xl bg-tomato/10 p-4 font-semibold text-tomato-ink">
              {deliveryProblem}
            </p>
          )}

          <Field id="notes" label="Order notes (optional)" error={err("notes")}>
            <textarea id="notes" className="field min-h-24" maxLength={500} {...register("notes")} />
          </Field>
        </section>

        <section aria-labelledby="co-pay" className="space-y-4">
          <h2 id="co-pay" className="display text-4xl">
            4. Payment
          </h2>
          {methods.length === 0 ? (
            <p role="alert" className="rounded-xl bg-stone p-4">
              No payment method is currently available for {fulfillment}. Please choose {fulfillment === "pickup" ? "delivery" : "pickup"} or call us.
            </p>
          ) : (
            <fieldset className="space-y-3">
              <legend className="sr-only">Payment method</legend>
              {methods.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-start gap-4 rounded-2xl bg-paper p-4 ring-2 ring-transparent has-[:checked]:ring-ink">
                  <input type="radio" value={m.id} className="mt-1 size-5 accent-[var(--color-ink)]" {...register("paymentMethod")} />
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-bold">
                      {m.label}
                      {m.mode === "demo" && <span className="eyebrow rounded-full bg-mustard px-2 py-0.5 text-ink">Demo</span>}
                    </span>
                    <span className="mt-1 block text-sm text-ink-soft">{m.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <label className="flex items-start gap-3 pt-2">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--color-tomato)]" {...register("acceptTerms")} aria-invalid={errors.acceptTerms ? true : undefined} aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined} />
            <span className="text-sm">
              I agree to the{" "}
              <Link href="/terms" className="font-semibold underline" target="_blank">
                Terms
              </Link>
              ,{" "}
              <Link href="/ordering-policy" className="font-semibold underline" target="_blank">
                Ordering & Cancellation Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="text-sm font-semibold text-tomato-ink">
              {errors.acceptTerms.message}
            </p>
          )}
        </section>
      </div>

      <aside className="lg:col-span-5" aria-labelledby="co-summary">
        <div className="space-y-5 rounded-[1.5rem] bg-paper p-6 lg:sticky lg:top-28 sm:p-8">
          <div className="flex items-baseline justify-between">
            <h2 id="co-summary" className="display text-4xl">
              Order summary
            </h2>
            <span className="eyebrow rounded-full bg-stone px-3 py-1">{fulfillment}</span>
          </div>
          <ul className="divide-y divide-ink/10">
            {pricing.lines.map((l, i) => {
              const product = productById.get(l.productId);
              return (
                <li key={`${l.productId}-${i}`} className="flex gap-3 py-3">
                  {product && <ProductVisual image={product.image} className="size-14 shrink-0 rounded-lg bg-stone p-1.5" />}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-bold">
                      {l.quantity} × {l.name}
                    </p>
                    {l.modifiers.length > 0 && <p className="text-ink-soft">{l.modifiers.map((m) => m.name).join(" · ")}</p>}
                    {l.note && <p className="italic text-ink-soft">“{l.note}”</p>}
                  </div>
                  <p className="text-sm font-bold tabular-nums">{formatMoney(l.lineTotal)}</p>
                </li>
              );
            })}
          </ul>
          {!pricing.ok && (
            <p role="alert" className="text-sm font-semibold text-tomato-ink">
              {pricing.errors[0]} Remove it from your cart to continue.
            </p>
          )}
          <TotalsTable totals={pricing.totals} fulfillment={fulfillment} />
          <button type="submit" className="btn btn-primary w-full justify-between" disabled={submitting || blocked} aria-disabled={submitting || blocked}>
            <span className="flex items-center gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
              {submitting ? "Placing order…" : "Place order"}
            </span>
            <span className="tabular-nums">{formatMoney(pricing.totals.total)}</span>
          </button>
          <p className="text-xs text-ink-soft">
            Prices, taxes and fees are re-calculated by our server when you place the order.
          </p>
        </div>
      </aside>
    </form>
  );
}
