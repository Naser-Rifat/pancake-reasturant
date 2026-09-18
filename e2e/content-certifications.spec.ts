import { expect, test } from "@playwright/test";
import { FALLBACK_SITE } from "../lib/fallback-data";

test("certification save exposes its API pending state", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("krush-admin-token", "test-token"),
  );

  const certification = {
    id: 1,
    icon: "shield",
    image: "",
    title: "Food Safety Certified",
    subtitle: "Victorian Food Safety Standards",
    sort_order: 0,
    is_active: true,
  };

  await page.route("**/api/admin/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname.endsWith("/admin/stats/")) {
      await route.fulfill({ json: { active_orders: 0, pending_bookings: 0 } });
      return;
    }

    if (
      pathname.endsWith("/admin/certifications/1/") &&
      request.method() === "PATCH"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({
        json: { ...certification, ...request.postDataJSON() },
      });
      return;
    }

    if (pathname.endsWith("/admin/certifications/")) {
      await route.fulfill({ json: [certification] });
      return;
    }

    if (pathname.endsWith("/admin/site/")) {
      await route.fulfill({ json: {} });
      return;
    }

    await route.fulfill({ json: [] });
  });

  await page.goto("/admin/content");
  await page.getByRole("button", { name: /Trust Badges/ }).click();

  const save = page.getByRole("button", { name: "Save", exact: true });
  await save.click();
  await expect(page.getByRole("button", { name: /Saving/ })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeEnabled();
  await expect(page.getByText("Badge updated")).toBeVisible();
});

test("club bento upload explains the required crop and blocks the wrong ratio", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("krush-admin-token", "test-token"),
  );

  await page.route("**/api/admin/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/admin/stats/")) {
      return route.fulfill({ json: { active_orders: 0, pending_bookings: 0 } });
    }
    if (pathname.endsWith("/admin/site/")) return route.fulfill({ json: FALLBACK_SITE });
    return route.fulfill({ json: [] });
  });

  await page.goto("/admin/content");
  await page.getByRole("button", { name: /Join Our Club/ }).click();
  await expect(page.getByText(/manager is the exact public bento layout/)).toBeVisible();
  await expect(page.getByText("Recommended 1200×1500px", { exact: false })).toBeVisible();

  await page
    .getByLabel("Replace image file")
    .first()
    .setInputFiles("public/menu/pancake-logo.png");
  await expect(page.getByText(/uses a fixed 4:5 portrait frame/).first()).toBeVisible();
  await expect(page.getByText("Upload Blocked by Validation", { exact: false })).toBeVisible();
});
