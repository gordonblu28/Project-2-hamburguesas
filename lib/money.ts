import { restaurant } from "@/config/restaurant";
import type { Cents } from "@/types/product";

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: Cents, locale = restaurant.locale, currency = restaurant.currency): string {
  const key = `${locale}|${currency}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: "currency", currency });
    formatters.set(key, f);
  }
  return f.format(cents / 100);
}

/** Basis-point percentage of an integer-cent amount, rounded half-up to the cent. */
export function applyBps(amount: Cents, bps: number): Cents {
  if (!Number.isInteger(amount)) throw new Error("amount must be integer cents");
  return Math.round((amount * bps) / 10_000);
}
