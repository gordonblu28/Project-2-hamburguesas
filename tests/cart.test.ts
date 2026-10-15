import { beforeEach, describe, expect, it } from "vitest";
import { productById } from "@/config/menu";
import { cartCount, useCart } from "@/lib/cart/store";
import { defaultSelections } from "@/lib/menu/pricing";

const house = productById.get("p_house_stack")!;
const base = defaultSelections(house);

describe("cart store", () => {
  beforeEach(() => useCart.setState({ lines: [], fulfillment: "pickup", postalCode: "" }));

  it("adds items and merges identical customizations", () => {
    useCart.getState().add(house.id, base, 1);
    useCart.getState().add(house.id, { ...base }, 2);
    expect(useCart.getState().lines).toHaveLength(1);
    expect(useCart.getState().lines[0]!.quantity).toBe(3);
  });

  it("keeps different customizations as separate lines", () => {
    useCart.getState().add(house.id, base, 1);
    useCart.getState().add(house.id, { ...base, extras: ["bacon"] }, 1);
    useCart.getState().add(house.id, base, 1, "cut in half");
    expect(useCart.getState().lines).toHaveLength(3);
    expect(cartCount(useCart.getState().lines)).toBe(3);
  });

  it("updates quantities, clamps to the maximum and removes at zero", () => {
    useCart.getState().add(house.id, base, 1);
    const key = useCart.getState().lines[0]!.key;
    useCart.getState().setQuantity(key, 4);
    expect(useCart.getState().lines[0]!.quantity).toBe(4);
    useCart.getState().setQuantity(key, 500);
    expect(useCart.getState().lines[0]!.quantity).toBe(20);
    useCart.getState().setQuantity(key, 0);
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it("removes and clears", () => {
    useCart.getState().add(house.id, base, 1);
    useCart.getState().add("p_fries", {}, 1);
    useCart.getState().remove(useCart.getState().lines[0]!.key);
    expect(useCart.getState().lines).toHaveLength(1);
    useCart.getState().clear();
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it("edits a line in place, merging into an identical line if needed", () => {
    useCart.getState().add("p_fries", {}, 1);
    useCart.getState().add(house.id, base, 1);
    const key = useCart.getState().lines[1]!.key;
    useCart.getState().replace(key, { ...base, extras: ["bacon"] }, 2);
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(2);
    expect(lines[1]!.selections.extras).toEqual(["bacon"]);
    expect(lines[1]!.quantity).toBe(2);
  });
});
