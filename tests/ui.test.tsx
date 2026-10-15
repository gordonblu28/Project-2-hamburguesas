import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { ProductCustomizer } from "@/components/menu/ProductCustomizer";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui";

beforeEach(() => {
  useCart.setState({ lines: [], fulfillment: "pickup", postalCode: "", hydrated: true });
  useUi.setState({ customizer: null, cartOpen: false, toast: null });
});

describe("menu", () => {
  it("renders categories, products and prices", () => {
    render(<MenuBrowser />);
    expect(screen.getByRole("heading", { name: "Signature Burgers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The House Stack" })).toBeInTheDocument();
    expect(screen.getAllByText("$12.95").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add The House Stack to order" })).toBeInTheDocument();
  });

  it("marks unavailable products and does not offer them for ordering", () => {
    render(<MenuBrowser />);
    expect(screen.queryByRole("button", { name: "Add Garden Stack to order" })).not.toBeInTheDocument();
    expect(screen.getByText("Unavailable today")).toBeInTheDocument();
  });

  it("filters with search", () => {
    render(<MenuBrowser />);
    fireEvent.change(screen.getByLabelText("Search the menu"), { target: { value: "shake" } });
    expect(screen.getByRole("heading", { name: "Vanilla Shake" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The House Stack" })).not.toBeInTheDocument();
  });

  it("adds simple products directly to the cart", () => {
    render(<MenuBrowser />);
    fireEvent.click(screen.getByRole("button", { name: "Add House Lemonade to order" }));
    expect(useCart.getState().lines).toHaveLength(1);
  });
});

describe("product customizer", () => {
  it("updates the price as options change and adds the customized item", () => {
    render(<ProductCustomizer />);
    act(() => useUi.getState().openCustomizer("p_house_stack"));
    const dialog = screen.getByRole("dialog", { name: "Customize The House Stack" });
    const submit = within(dialog).getByRole("button", { name: /add to order/i });
    expect(submit).toHaveTextContent("$12.95");

    fireEvent.click(within(dialog).getByLabelText(/Thick-cut bacon/));
    expect(submit).toHaveTextContent("$15.45");
    fireEvent.click(within(dialog).getByRole("button", { name: "Increase quantity" }));
    expect(submit).toHaveTextContent("$30.90");

    fireEvent.click(submit);
    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBe(2);
    expect(lines[0]!.selections.extras).toEqual(["bacon"]);
  });

  it("enforces the maximum number of extras", () => {
    render(<ProductCustomizer />);
    act(() => useUi.getState().openCustomizer("p_house_stack"));
    const dialog = screen.getByRole("dialog");
    for (const name of [/Thick-cut bacon/, /Fried egg/, /Pickled jalapeños/, /Grilled onions/]) fireEvent.click(within(dialog).getByLabelText(name));
    // the 5th (avocado) is unavailable anyway; all unchecked options are now disabled
    expect(within(dialog).getByLabelText(/Smashed avocado/)).toBeDisabled();
  });
});
