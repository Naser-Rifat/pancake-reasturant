import { expect, test } from "@playwright/test";

// Smoke suite: proves the storefront renders live API data, ordering is
// available, and the admin panel authenticates. Backend must be migrated,
// seeded (seed_demo) and have the staff user below.
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? "krush2026";

test("home renders hero, featured slider and reviews from the API", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-card-left h1")).toBeVisible();
  await expect(page.locator("#featured .menu-card")).toHaveCount(6);
  await expect(page.locator(".rev-card").first()).toBeVisible();
  // category filter narrows the slider
  await page.locator("#featured .album-tab", { hasText: "Choc Loaded" }).click();
  await expect(page.locator("#featured .menu-card")).toHaveCount(1);
});

test("menu page lists dishes with live ordering", async ({ page }) => {
  await page.goto("/menu");
  await expect(page.locator(".menu-grid .menu-card")).toHaveCount(6);
  // backend is up in this suite, so ordering must not be paused
  await expect(page.locator(".ordering-paused")).toHaveCount(0);
  await expect(page.locator(".menu-card .btn", { hasText: "Add to Order" }).first()).toBeVisible();
});

test("booking page shows the reservation form", async ({ page }) => {
  await page.goto("/booking");
  await expect(page.locator("form.bk-form, .widget-card form").first()).toBeVisible();
});

test("no horizontal overflow on phone-width home page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBe(0);
});

test("admin panel authenticates staff and shows the dashboard", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("**/admin/login"); // guard redirects anonymous visitors
  await page.fill("#username", ADMIN_USER);
  await page.fill("#password", ADMIN_PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
  await expect(page.getByText("Orders today")).toBeVisible();
});
