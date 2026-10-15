import { describe, expect, it } from "vitest";
import { productById } from "@/config/menu";
import {
  computeTotals,
  defaultSelections,
  findDeliveryZone,
  lineKey,
  priceCart,
  priceLine,
  unitPrice,
  validateSelections,
} from "@/lib/menu/pricing";
import { applyBps, formatMoney } from "@/lib/money";
import { testConfig } from "./helpers";

const house = productById.get("p_house_stack")!;
const classic = productById.get("p_classic_cheese")!;

describe("money", () => {
  it("formats cents with the configured locale and currency", () => {
    expect(formatMoney(1295)).toBe("$12.95");
    expect(formatMoney(0)).toBe("$0.00");
  });
  it("applies basis points with half-up rounding on integer cents", () => {
    expect(applyBps(1000, 875)).toBe(88); // 87.5 -> 88
    expect(applyBps(1295, 875)).toBe(113); // 113.3125
    expect(() => applyBps(10.5, 100)).toThrow();
  });
});

describe("modifier validation", () => {
  it("accepts the default selections", () => {
    const r = validateSelections(house, defaultSelections(house));
    expect(r.ok).toBe(true);
  });

  it("requires single-choice groups with min 1", () => {
    const sel = { ...defaultSelections(house), cheese: [] };
    const r = validateSelections(house, sel);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.cheese).toMatch(/choose/i);
  });

  it("enforces maximum selections", () => {
    const sel = { ...defaultSelections(house), extras: ["bacon", "egg", "jalapenos", "grilled-onions", "egg"] };
    // duplicates are collapsed, so this is 4 distinct -> ok
    expect(validateSelections(house, sel).ok).toBe(true);
    const tooMany = { ...defaultSelections(house), cheese: ["american", "cheddar"] };
    expect(validateSelections(house, tooMany).ok).toBe(false);
  });

  it("rejects unavailable, unknown options and unknown groups", () => {
    expect(validateSelections(house, { ...defaultSelections(house), extras: ["avocado"] }).ok).toBe(false);
    expect(validateSelections(house, { ...defaultSelections(house), extras: ["gold-leaf"] }).ok).toBe(false);
    expect(validateSelections(house, { ...defaultSelections(house), secret: ["x"] }).ok).toBe(false);
  });

  it("calculates modifier price adjustments", () => {
    const r = validateSelections(house, { ...defaultSelections(house), extras: ["bacon", "egg"], cheese: ["cheddar"] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(unitPrice(house, r.modifiers)).toBe(1295 + 250 + 150 + 50);
    const dbl = validateSelections(classic, { ...defaultSelections(classic), patties: ["double"] });
    if (dbl.ok) expect(unitPrice(classic, dbl.modifiers)).toBe(995 + 350);
  });
});

describe("line pricing", () => {
  it("multiplies the unit price by quantity", () => {
    const r = priceLine({ productId: house.id, quantity: 3, selections: { ...defaultSelections(house), extras: ["bacon"] } });
    expect(r.ok && r.line.lineTotal).toBe((1295 + 250) * 3);
  });
  it("rejects unavailable products", () => {
    const r = priceLine({ productId: "p_garden_stack", quantity: 1, selections: defaultSelections(productById.get("p_garden_stack")!) });
    expect(r.ok).toBe(false);
  });
  it("rejects unknown products and invalid quantities", () => {
    expect(priceLine({ productId: "nope", quantity: 1, selections: {} }).ok).toBe(false);
    expect(priceLine({ productId: house.id, quantity: 0, selections: defaultSelections(house) }).ok).toBe(false);
    expect(priceLine({ productId: house.id, quantity: 1.5, selections: defaultSelections(house) }).ok).toBe(false);
    expect(priceLine({ productId: house.id, quantity: 999, selections: defaultSelections(house) }).ok).toBe(false);
  });
  it("produces stable keys regardless of selection order", () => {
    expect(lineKey("a", { x: ["2", "1"], y: ["z"] })).toBe(lineKey("a", { y: ["z"], x: ["1", "2"] }));
    expect(lineKey("a", { x: ["1"] })).not.toBe(lineKey("a", { x: ["2"] }));
    expect(lineKey("a", { x: ["1"] }, "no salt")).not.toBe(lineKey("a", { x: ["1"] }));
  });
});

describe("order totals", () => {
  const cfg = testConfig();
  it("charges no delivery fee for pickup", () => {
    const t = computeTotals(2000, "pickup", null, cfg);
    expect(t.deliveryFee).toBe(0);
    expect(t.tax).toBe(175);
    expect(t.total).toBe(2175);
  });
  it("adds the zone delivery fee for delivery (untaxed by default)", () => {
    const zoneB = cfg.delivery.zones.find((z) => z.id === "zone-b")!;
    const t = computeTotals(3000, "delivery", zoneB, cfg);
    expect(t.deliveryFee).toBe(599);
    expect(t.tax).toBe(applyBps(3000, cfg.tax.rateBps));
    expect(t.total).toBe(3000 + 599 + t.tax);
  });
  it("supports taxing the delivery fee and a service fee", () => {
    const c = testConfig({ fees: { serviceFeeBps: 300, serviceFeeLabel: "Service" }, tax: { ...cfg.tax, taxDeliveryFee: true, taxServiceFee: true } });
    const t = computeTotals(2000, "delivery", null, c);
    expect(t.serviceFee).toBe(60);
    expect(t.tax).toBe(applyBps(2000 + 60 + c.delivery.fee, c.tax.rateBps));
    expect(t.total).toBe(2000 + 60 + c.delivery.fee + t.tax);
  });
  it("never lets a discount exceed the subtotal", () => {
    expect(computeTotals(1000, "pickup", null, cfg, 5000).discount).toBe(1000);
  });
  it("prices a whole cart and reports invalid lines", () => {
    const ok = priceCart([{ productId: house.id, quantity: 2, selections: defaultSelections(house) }], "pickup", null, cfg);
    expect(ok.ok).toBe(true);
    expect(ok.totals.subtotal).toBe(2590);
    const bad = priceCart([{ productId: "p_garden_stack", quantity: 1, selections: {} }], "pickup", null, cfg);
    expect(bad.ok).toBe(false);
  });
});

describe("delivery zones", () => {
  it("finds zones by postal code", () => {
    expect(findDeliveryZone("00000")?.id).toBe("zone-a");
    expect(findDeliveryZone(" 00010 ")?.id).toBe("zone-b");
    expect(findDeliveryZone("99999")).toBeNull();
    expect(findDeliveryZone("")).toBeNull();
  });
});
