"use client";

import { AlertCircle, Check } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { productById } from "@/config/menu";
import { restaurant } from "@/config/restaurant";
import { ProductVisual } from "@/components/art/ProductVisual";
import { ART_TONE } from "@/components/art/FoodArt";
import { Sheet, SheetClose } from "@/components/ui/Sheet";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";
import { defaultSelections, unitPrice, validateSelections } from "@/lib/menu/pricing";
import { formatMoney } from "@/lib/money";
import type { ModifierGroup, ModifierSelection, Product } from "@/types/product";
import { QuantityStepper } from "./QuantityStepper";

const TONE_BG = { stone: "bg-stone", mustard: "bg-mustard", tomato: "bg-tomato", ink: "bg-ink", ivory: "bg-ivory" } as const;

/** Global product customization dialog. Mounted once in the root layout. */
export function ProductCustomizer() {
  const state = useUi((s) => s.customizer);
  const close = useUi((s) => s.closeCustomizer);
  const product = state ? productById.get(state.productId) : undefined;
  return (
    <Sheet open={Boolean(product)} onClose={close} label={product ? `Customize ${product.name}` : "Customize item"} side="bottom">
      {product && state && <CustomizerBody key={`${product.id}-${state.editKey ?? "new"}`} product={product} editKey={state.editKey} />}
    </Sheet>
  );
}

function CustomizerBody({ product, editKey }: { product: Product; editKey?: string }) {
  const close = useUi((s) => s.closeCustomizer);
  const notify = useUi((s) => s.notify);
  const add = useCart((s) => s.add);
  const replace = useCart((s) => s.replace);
  const editing = useCart((s) => (editKey ? s.lines.find((l) => l.key === editKey) : undefined));

  const [selections, setSelections] = useState<ModifierSelection>(() => editing?.selections ?? defaultSelections(product));
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [note, setNote] = useState(editing?.note ?? "");
  const [showErrors, setShowErrors] = useState(false);
  const titleId = useId();

  const result = useMemo(() => validateSelections(product, selections), [product, selections]);
  const modifiers = result.ok ? result.modifiers : [];
  const unit = unitPrice(product, modifiers);
  const errors = result.ok ? {} : result.errors;

  const toggle = (group: ModifierGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.type === "single") return { ...prev, [group.id]: [optionId] };
      if (current.includes(optionId)) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      if (current.length >= group.max) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const submit = () => {
    if (!result.ok || !product.available) {
      setShowErrors(true);
      return;
    }
    if (editKey) replace(editKey, result.selections, quantity, note);
    else add(product.id, result.selections, quantity, note);
    close();
    notify(editKey ? `Updated ${product.name}` : `${quantity} × ${product.name} added`);
  };

  const tone = ART_TONE[product.image.art];

  return (
    <form
      className="flex max-h-[inherit] flex-col"
      aria-labelledby={titleId}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="overflow-y-auto overscroll-contain">
        <div className={`relative ${TONE_BG[tone]} grain px-6 pb-6 pt-16 sm:px-10`}>
          <div className="absolute right-4 top-4">
            <SheetClose onClose={close} />
          </div>
          <ProductVisual image={product.image} className="mx-auto aspect-[4/3] w-full max-w-[18rem]" sizes="320px" />
        </div>
        <div className="space-y-8 px-6 py-8 sm:px-10">
          <header>
            <h2 id={titleId} className="display text-5xl">
              {product.name}
            </h2>
            <p className="mt-3 text-ink-soft">{product.description}</p>
            <p className="mt-3 text-lg font-bold">
              {formatMoney(product.price)} <span className="text-sm font-medium text-ink-soft">base price</span>
            </p>
            {product.preparationNote && <p className="mt-2 text-sm text-ink-soft">{product.preparationNote}</p>}
            {product.allergens && product.allergens.length > 0 && (
              <p className="mt-2 text-sm">
                <span className="font-semibold">Allergens:</span> {product.allergens.join(", ")}
              </p>
            )}
            {!product.available && (
              <p role="alert" className="mt-4 rounded-lg bg-tomato/10 p-3 text-sm font-semibold text-tomato-ink">
                Sorry, {product.name} is unavailable right now.
              </p>
            )}
          </header>

          {product.modifierGroups.map((group) => {
            const selected = selections[group.id] ?? [];
            const err = showErrors ? errors[group.id] : undefined;
            const required = group.min > 0;
            const Input = group.type === "single" ? "radio" : "checkbox";
            return (
              <fieldset key={group.id} aria-describedby={err ? `${group.id}-err` : undefined}>
                <legend className="flex w-full items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
                  <span className="text-lg font-bold">{group.name}</span>
                  <span className="eyebrow text-ink-soft">{required ? "Required" : (group.hint ?? "Optional")}</span>
                </legend>
                {err && (
                  <p id={`${group.id}-err`} className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-tomato-ink">
                    <AlertCircle className="size-4" aria-hidden="true" /> {err}
                  </p>
                )}
                <div className="mt-2 divide-y divide-ink/5">
                  {group.options.map((opt) => {
                    const checked = selected.includes(opt.id);
                    const unavailable = opt.available === false;
                    const atMax = group.type === "multiple" && !checked && selected.length >= group.max;
                    return (
                      <label
                        key={opt.id}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 py-2 ${unavailable || atMax ? "cursor-not-allowed opacity-45" : ""}`}
                      >
                        <input
                          type={Input}
                          name={`${product.id}-${group.id}`}
                          value={opt.id}
                          checked={checked}
                          disabled={unavailable || atMax}
                          onChange={() => toggle(group, opt.id)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={`grid size-6 shrink-0 place-items-center border-2 border-ink/25 transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-tomato ${group.type === "single" ? "rounded-full" : "rounded-md"}`}
                        >
                          {checked && <Check className="size-4" />}
                        </span>
                        <span className="flex-1">
                          {opt.name}
                          {unavailable && <span className="ml-2 text-xs font-semibold uppercase text-tomato-ink">Sold out</span>}
                        </span>
                        {opt.priceDelta > 0 && <span className="text-sm tabular-nums text-ink-soft">+{formatMoney(opt.priceDelta)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {product.allowsNote && (
            <div>
              <label htmlFor={`${product.id}-note`} className="text-lg font-bold">
                Preparation note <span className="text-sm font-medium text-ink-soft">(optional)</span>
              </label>
              <textarea
                id={`${product.id}-note`}
                className="field mt-2 min-h-20"
                maxLength={140}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. cut in half"
              />
              <p className="mt-1 text-xs text-ink-soft">The kitchen will do its best, but can&rsquo;t guarantee special requests.</p>
            </div>
          )}

          {modifiers.some((m) => m.priceDelta > 0) && (
            <div className="rounded-xl bg-stone p-4 text-sm">
              <p className="eyebrow mb-2">Your build</p>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span>{product.name}</span>
                  <span className="tabular-nums">{formatMoney(product.price)}</span>
                </li>
                {modifiers
                  .filter((m) => m.priceDelta > 0)
                  .map((m) => (
                    <li key={`${m.groupId}-${m.optionId}`} className="flex justify-between text-ink-soft">
                      <span>+ {m.name}</span>
                      <span className="tabular-nums">{formatMoney(m.priceDelta)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-ink/10 bg-ivory px-6 py-4 sm:px-10">
        <QuantityStepper value={quantity} onChange={setQuantity} max={restaurant.ordering.maxItemQuantity} label="Quantity" />
        <button type="submit" className="btn btn-primary flex-1 justify-between" disabled={!product.available}>
          <span>{editKey ? "Update item" : "Add to order"}</span>
          <span className="tabular-nums" aria-live="polite">
            {formatMoney(unit * quantity)}
          </span>
        </button>
      </div>
    </form>
  );
}
