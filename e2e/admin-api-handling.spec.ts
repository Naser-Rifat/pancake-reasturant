import { expect, test } from "@playwright/test";
import { FALLBACK_SITE } from "../lib/fallback-data";

const stats = {
  orders_today: 0,
  revenue_today: "0.00",
  active_orders: 0,
  pending_bookings: 0,
  pending_reviews: 0,
  total_orders: 0,
  total_bookings: 0,
};

test("every admin screen loads through its TanStack query without an API error", async ({ page }) => {
  const requested = new Set<string>();
  await page.addInitScript(() => localStorage.setItem("krush-admin-token", "admin-e2e-token"));
  await page.route("**/api/admin/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    requested.add(pathname);

    if (pathname.endsWith("/admin/stats/")) return route.fulfill({ json: stats });
    if (pathname.endsWith("/admin/site/")) return route.fulfill({ json: FALLBACK_SITE });
    if (pathname.endsWith("/admin/club-members/stats/")) {
      return route.fulfill({ json: { total: 0, active: 0, archived: 0, consented: 0 } });
    }
    if (pathname.endsWith("/admin/club-members/")) {
      return route.fulfill({ json: { count: 0, results: [] } });
    }
    return route.fulfill({ json: [] });
  });

  const screens = [
    ["/admin", "Dashboard"],
    ["/admin/orders", "Orders"],
    ["/admin/bookings", "Bookings"],
    ["/admin/menu", "Menu"],
    ["/admin/categories", "Categories"],
    ["/admin/coupons", "Coupons & Deals"],
    ["/admin/reviews", "Reviews"],
    ["/admin/club", "Club Members"],
    ["/admin/content", "Site Content"],
    ["/admin/settings", "Settings"],
  ] as const;

  for (const [path, heading] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByText("Could not load data")).toHaveCount(0);
  }

  for (const endpoint of [
    "/api/admin/stats/",
    "/api/admin/orders/",
    "/api/admin/bookings/",
    "/api/admin/menu/",
    "/api/admin/categories/",
    "/api/admin/coupons/",
    "/api/admin/reviews/",
    "/api/admin/club-members/",
    "/api/admin/club-members/stats/",
    "/api/admin/site/",
    "/api/admin/announcements/",
    "/api/admin/certifications/",
    "/api/admin/gallery/",
    "/api/admin/hours/",
  ]) {
    expect(requested, `missing frontend request for ${endpoint}`).toContain(endpoint);
  }
});

test("logout has a pending state, calls the revoke endpoint, and clears admin access", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("krush-admin-token", "admin-e2e-token"));
  let logoutCalls = 0;
  await page.route("**/api/admin/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/admin/logout/")) {
      logoutCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return route.fulfill({ status: 204, body: "" });
    }
    if (pathname.endsWith("/admin/stats/")) return route.fulfill({ json: stats });
    if (pathname.endsWith("/admin/site/")) return route.fulfill({ json: FALLBACK_SITE });
    return route.fulfill({ json: [] });
  });

  await page.goto("/admin");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Logging out…" })).toBeDisabled();
  await page.waitForURL("**/admin/login");
  expect(logoutCalls).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem("krush-admin-token"))).toBeNull();
});
