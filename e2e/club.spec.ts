import { expect, test } from "@playwright/test";

test("club layout and navigation fit small phones, tablets and desktops", async ({ page }, testInfo) => {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/join-our-club");
    await expect(page.getByRole("button", { name: "Count me in" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}px`).toBeTruthy();
    if (width === 1024) await page.screenshot({ path: testInfo.outputPath("club-tablet.png"), fullPage: true });
  }
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await expect(page.locator(".hero-nav-links").getByRole("link", { name: "Join Our Club" })).toBeVisible();
  for (const link of await page.locator(".hero-nav-links a, .hero-order").all()) {
    expect(await link.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThanOrEqual(44);
  }
  await page.screenshot({ path: testInfo.outputPath("home-navigation.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("server validation focuses the field and optional consent is submitted", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/club/join/", async (route) => {
    calls++;
    expect(route.request().postDataJSON().marketing_consent).toBe(true);
    await route.fulfill(calls === 1 ? { status: 400, json: { email: ["Please use a valid email address."] } } : { status: 202, json: {} });
  });
  await page.goto("/join-our-club");
  await page.getByLabel("Your name", { exact: true }).fill("Alex");
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.com");
  await page.getByRole("checkbox", { name: /Send me menu news/ }).check();
  await page.getByRole("checkbox", { name: /I agree to my details/ }).check();
  await page.getByRole("button", { name: "Count me in" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
  await expect(page.getByText("Please use a valid email address.")).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("alex.taylor@example.com");
  await page.getByRole("button", { name: "Count me in" }).click();
  await expect(page.getByRole("heading", { name: "Thanks for joining!" })).toBeVisible();
});

test("admin recovers from a failed load", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("krush-admin-token", "club-test-token"));
  await page.route("**/api/admin/stats/", (route) => route.fulfill({ json: { active_orders: 0, pending_bookings: 0 } }));
  let recover = false;
  await page.route("**/api/admin/club-members/**", async (route) => {
    await route.fulfill(!recover ? { status: 500, json: { detail: "Could not load members." } } : { json: { count: 0, results: [] } });
  });
  await page.goto("/admin/club");
  await expect(page.getByText("Could not load members.")).toBeVisible();
  recover = true;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Your club starts here")).toBeVisible();
});

test("club registration validates required fields and submits explicit consent", async ({ page }, testInfo) => {
  let calls = 0;
  await page.route("**/api/club/join/", async (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ name: "Alex Taylor", email: "alex@example.com", privacy_consent: true, marketing_consent: false, website: "" });
    await route.fulfill({ status: 202, json: { detail: "Thanks for joining!" } });
  });
  await page.goto("/join-our-club");
  await expect(page.getByRole("heading", { name: "Good food. Better company." })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("club-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Count me in" }).click();
  expect(calls).toBe(0);
  await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.com");
  await page.getByRole("checkbox", { name: /I agree to my details/ }).check();
  await page.getByRole("button", { name: "Count me in" }).click();
  await expect(page.getByRole("heading", { name: "Thanks for joining!" })).toBeVisible();
  expect(calls).toBe(1);
});

test("mobile club form retains values on failure and allows retry", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let calls = 0;
  await page.route("**/api/club/join/", async (route) => {
    calls++;
    await route.fulfill({ status: calls === 1 ? 429 : 202, json: {} });
  });
  await page.goto("/join-our-club");
  await expect(page.locator("main img").first()).toBeVisible();
  await expect(page.locator("main img")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("club-mobile.png"), fullPage: true });
  await page.getByLabel("Your name", { exact: true }).fill("Alex Taylor");
  await page.getByLabel("Email address", { exact: true }).fill("alex@example.com");
  await page.getByRole("checkbox", { name: /I agree to my details/ }).check();
  await page.getByRole("button", { name: "Count me in" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Too many attempts");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Alex Taylor");
  await page.getByRole("button", { name: "Count me in" }).click();
  await expect(page.getByRole("heading", { name: "Thanks for joining!" })).toBeVisible();
});

test("admin uses shared table with search, consent management and deletion", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("krush-admin-token", "club-test-token"));
  const member = { id: 1, name: "Alex Taylor", email: "alex@example.com", status: "active", marketing_consent: true, marketing_consented_at: "2026-09-16T10:00:00Z", privacy_accepted_at: "2026-09-16T10:00:00Z", consent_version: "club-v1", created_at: "2026-09-16T10:00:00Z" };
  let deleted = false;
  await page.route("**/api/admin/stats/", (route) => route.fulfill({ json: { active_orders: 0, pending_bookings: 0 } }));
  await page.route("**/api/admin/club-members/**", async (route) => {
    const request = route.request();
    if (request.method() === "DELETE") { deleted = true; await route.fulfill({ status: 204 }); return; }
    if (request.method() === "POST") { member.marketing_consent = false; await route.fulfill({ json: member }); return; }
    if (request.method() === "PATCH") { member.status = request.postDataJSON().status; await route.fulfill({ json: member }); return; }
    const query = new URL(request.url()).searchParams;
    const matches = !deleted && member.name.toLowerCase().includes((query.get("search") || "").toLowerCase());
    await route.fulfill({ json: { count: matches ? 1 : 0, results: matches ? [member] : [] } });
  });
  await page.goto("/admin/club");
  await expect(page.getByRole("columnheader", { name: "Email preference" })).toBeVisible();
  await page.getByRole("textbox", { name: "Search members" }).fill("Nobody");
  await expect(page.getByText("No matching members")).toBeVisible();
  await page.getByRole("textbox", { name: "Search members" }).fill("Alex");
  await expect(page.getByRole("cell", { name: /Alex Taylor/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Search members" }).fill("");
  await expect(page.getByText("1 registration", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Opt out", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("cell", { name: /No marketing/ })).toBeVisible();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Archived", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete registration", exact: true }).click();
  await expect(page.getByText("Your club starts here")).toBeVisible();
});
