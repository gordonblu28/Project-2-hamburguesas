import { productById } from "@/config/menu";
import { restaurant } from "@/config/restaurant";
import { applyBps } from "@/lib/money";
import type { CartLineInput, OrderTotals, PricedLine, PricedModifier } from "@/types/order";
import type { Cents, ModifierSelection, Product } from "@/types/product";
import type { DeliveryZone, FulfillmentType, RestaurantConfig } from "@/types/restaurant";

export function defaultSelections(product: Product): ModifierSelection {
  const out: ModifierSelection = {};
  for (const g of product.modifierGroups) {
    const defaults = g.options.filter((o) => o.default && o.available !== false).map((o) => o.id);
    if (defaults.length) out[g.id] = defaults.slice(0, g.max);
    else if (g.type === "single" && g.min > 0) {
      const first = g.options.find((o) => o.available !== false);
      if (first) out[g.id] = [first.id];
    } else out[g.id] = [];
  }
  return out;
}

export type SelectionResult =
  | { ok: true; selections: ModifierSelection; modifiers: PricedModifier[] }
  | { ok: false; errors: Record<string, string> };

/** Validates selections against the product's modifier rules and returns normalized, priced modifiers. */
export function validateSelections(product: Product, raw: ModifierSelection | undefined): SelectionResult {
  const errors: Record<string, string> = {};
  const selections: ModifierSelection = {};
  const modifiers: PricedModifier[] = [];
  const input = raw ?? {};

  for (const key of Object.keys(input)) {
    if (!product.modifierGroups.some((g) => g.id === key)) errors[key] = "Unknown option group";
  }

  for (const group of product.modifierGroups) {
    const ids = Array.from(new Set(input[group.id] ?? []));
    const max = group.type === "single" ? 1 : group.max;
    if (ids.length < group.min) {
      errors[group.id] = group.min === 1 ? `Choose a ${group.name.toLowerCase()}` : `Choose at least ${group.min}`;
      continue;
    }
    if (ids.length > max) {
      errors[group.id] = `Choose up to ${max}`;
      continue;
    }
    const picked = [];
    for (const id of ids) {
      const opt = group.options.find((o) => o.id === id);
      if (!opt) {
        errors[group.id] = "Unknown option";
        break;
      }
      if (opt.available === false) {
        errors[group.id] = `${opt.name} is unavailable`;
        break;
      }
      picked.push(opt);
    }
    if (errors[group.id]) continue;
    // Keep the configured option order so equal selections produce identical keys.
    picked.sort((a, b) => group.options.indexOf(a) - group.options.indexOf(b));
    selections[group.id] = picked.map((o) => o.id);
    for (const o of picked) {
      modifiers.push({ groupId: group.id, groupName: group.name, optionId: o.id, name: o.name, priceDelta: o.priceDelta });
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, selections, modifiers };
}

export function unitPrice(product: Product, modifiers: PricedModifier[]): Cents {
  return product.price + modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
}

export type LineResult = { ok: true; line: PricedLine } | { ok: false; error: string };

export function priceLine(input: CartLineInput, config: RestaurantConfig = restaurant): LineResult {
  const product = productById.get(input.productId);
  if (!product) return { ok: false, error: "This item is no longer on the menu." };
  if (!product.available) return { ok: false, error: `${product.name} is currently unavailable.` };
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > config.ordering.maxItemQuantity) {
    return { ok: false, error: `Quantity for ${product.name} must be between 1 and ${config.ordering.maxItemQuantity}.` };
  }
  const sel = validateSelections(product, input.selections);
  if (!sel.ok) return { ok: false, error: `${product.name}: ${Object.values(sel.errors)[0]}` };
  const unit = unitPrice(product, sel.modifiers);
  const note = product.allowsNote && input.note?.trim() ? input.note.trim().slice(0, 140) : undefined;
  return {
    ok: true,
    line: {
      productId: product.id,
      name: product.name,
      quantity: input.quantity,
      unitPrice: unit,
      lineTotal: unit * input.quantity,
      modifiers: sel.modifiers,
      note,
    },
  };
}

/** Stable identity for a cart line: same product + same selections + same note merge together. */
export function lineKey(productId: string, selections: ModifierSelection, note?: string): string {
  const parts = Object.keys(selections)
    .sort()
    .map((g) => `${g}=${[...(selections[g] ?? [])].sort().join(",")}`);
  return `${productId}|${parts.join(";")}|${(note ?? "").trim().toLowerCase()}`;
}

export function findDeliveryZone(postalCode: string | undefined, config: RestaurantConfig = restaurant): DeliveryZone | null {
  const code = (postalCode ?? "").trim().toUpperCase();
  if (!code) return null;
  return config.delivery.zones.find((z) => z.postalCodes.some((p) => p.toUpperCase() === code)) ?? null;
}

export function deliveryTerms(zone: DeliveryZone | null, config: RestaurantConfig = restaurant) {
  return {
    fee: zone?.fee ?? config.delivery.fee,
    minimumOrder: zone?.minimumOrder ?? config.delivery.minimumOrder,
  };
}

export function computeTotals(
  subtotal: Cents,
  fulfillment: FulfillmentType,
  zone: DeliveryZone | null,
  config: RestaurantConfig = restaurant,
  discount: Cents = 0,
): OrderTotals {
  const deliveryFee = fulfillment === "delivery" && subtotal > 0 ? deliveryTerms(zone, config).fee : 0;
  const serviceFee = subtotal > 0 ? applyBps(subtotal, config.fees.serviceFeeBps) : 0;
  const safeDiscount = Math.min(Math.max(0, discount), subtotal);
  const taxable =
    subtotal - safeDiscount + (config.tax.taxServiceFee ? serviceFee : 0) + (config.tax.taxDeliveryFee ? deliveryFee : 0);
  const tax = applyBps(Math.max(0, taxable), config.tax.rateBps);
  return {
    subtotal,
    serviceFee,
    deliveryFee,
    discount: safeDiscount,
    tax,
    total: subtotal - safeDiscount + serviceFee + deliveryFee + tax,
  };
}

export type CartPricing =
  | { ok: true; lines: PricedLine[]; totals: OrderTotals }
  | { ok: false; errors: string[]; lines: PricedLine[]; totals: OrderTotals };

export function priceCart(
  inputs: CartLineInput[],
  fulfillment: FulfillmentType,
  zone: DeliveryZone | null,
  config: RestaurantConfig = restaurant,
): CartPricing {
  const lines: PricedLine[] = [];
  const errors: string[] = [];
  for (const input of inputs) {
    const r = priceLine(input, config);
    if (r.ok) lines.push(r.line);
    else errors.push(r.error);
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const totals = computeTotals(subtotal, fulfillment, zone, config);
  return errors.length ? { ok: false, errors, lines, totals } : { ok: true, lines, totals };
}
