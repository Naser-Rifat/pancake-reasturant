import { expect, test } from "@playwright/test";

// Smoke suite: proves the storefront renders live API data, ordering is
// available, and the admin panel authenticates. Backend must be migrated,
// seeded (seed_demo) and have the staff user below.
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? "krush2026";

test("home renders hero, featured slider and reviews from the API", async ({ page }) => {
  // staff manage the menu, so counts must follow the live API, not a fixture
  const menu = await (await page.request.get("http://localhost:8000/api/menu/")).json();
  await page.goto("/");
  await expect(page.locator(".hero-card-left h1")).toBeVisible();
  // "Our Favourites" rail shows the top picks (up to six)
  await expect(page.locator("#featured .fav-card")).toHaveCount(Math.min(6, menu.length));
  await expect(page.locator(".rev-card").first()).toBeVisible();
});

test("menu page lists dishes with live ordering", async ({ page }) => {
  const menu = await (await page.request.get("http://localhost:8000/api/menu/")).json();
  await page.goto("/menu");
  await expect(page.locator(".menu-grid .menu-card")).toHaveCount(menu.length);
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
