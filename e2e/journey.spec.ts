import { expect, test, type Page } from "@playwright/test";

async function addHouseStackWithBacon(page: Page) {
  await page.goto("/order");
  await page.getByRole("button", { name: "Add The House Stack to order" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Customize The House Stack" });
  await expect(dialog).toBeVisible();
  await dialog.getByText("Thick-cut bacon").click();
  const submit = dialog.getByRole("button", { name: /add to order/i });
  await expect(submit).toContainText("$15.45");
  await submit.click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("1 × The House Stack added")).toBeVisible();
}

async function openCart(page: Page) {
  await page.getByRole("button", { name: /^Open cart/ }).click();
  return page.getByRole("dialog", { name: "Your order" });
}

test("home page hero CTAs lead to ordering and the menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good food.");
  await page.getByRole("link", { name: /order now/i }).click();
  await expect(page).toHaveURL(/\/order$/);
  await expect(page.getByRole("heading", { name: "Signature Burgers" })).toBeVisible();
});

test("customize, edit cart and place a pickup order", async ({ page }) => {
  await addHouseStackWithBacon(page);
  const cart = await openCart(page);
  await expect(cart.getByText("The House Stack")).toBeVisible();
  await cart.getByRole("button", { name: "Increase quantity" }).click();
  await expect(cart.getByText("$30.90").first()).toBeVisible();
  await cart.getByRole("link", { name: /checkout/i }).click();

  await expect(page).toHaveURL(/\/checkout/);
  // Server-provided time slot or ASAP is pre-selected
  await expect(page.getByLabel(/pickup time/i)).not.toHaveValue("");
  await page.getByLabel("Full name").fill("Jamie Doe");
  await page.getByLabel("Phone").fill("(555) 010-0100");
  await page.getByLabel(/Pay at pickup/).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/order-confirmation\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Order received.");
  await expect(page.getByText(/Development demo order/)).toBeVisible();
  await expect(page.getByText("2 × The House Stack")).toBeVisible();
  // cart was cleared after the order
  await expect(page.getByRole("button", { name: "Open cart, 0 items" })).toBeVisible();
});

test("checkout shows inline validation errors", async ({ page }) => {
  await addHouseStackWithBacon(page);
  await page.goto("/checkout");
  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page.getByText("Enter your name")).toBeVisible();
  await expect(page.getByText("Enter a phone number")).toBeVisible();
  await expect(page.getByText("Please accept the terms to continue")).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
});

test("delivery outside the zone is explained before checkout", async ({ page }) => {
  await addHouseStackWithBacon(page);
  const cart = await openCart(page);
  await cart.getByRole("radio", { name: "Delivery" }).click();
  await cart.getByLabel("Delivery postal code").fill("99999");
  await expect(cart.getByText(/outside our delivery area/i)).toBeVisible();
  await expect(cart.getByRole("button", { name: "Check delivery postal code" })).toBeDisabled();
  await cart.getByLabel("Delivery postal code").fill("00000");
  await expect(cart.getByText(/We deliver here/)).toBeVisible();
  await expect(cart.getByText("Delivery fee")).toBeVisible();
});

test("checkout API rejects tampered or invalid payloads", async ({ request }) => {
  const res = await request.post("/api/checkout", { data: { items: [], total: 1 } });
  expect(res.status()).toBe(400);
  const avail = await request.get("/api/availability?fulfillment=pickup");
  expect(avail.ok()).toBeTruthy();
  const body = await avail.json();
  expect(Array.isArray(body.slots)).toBe(true);
});

test("navigation works on every viewport", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const nav = page.getByRole("dialog", { name: "Navigation menu" });
    await nav.getByRole("link", { name: /Location & Hours/ }).click();
  } else {
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Location & Hours" }).click();
  }
  await expect(page).toHaveURL(/\/location$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Location");
  await expect(page.getByRole("table")).toContainText("Monday");
});
