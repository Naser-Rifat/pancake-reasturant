import { expect, test } from "@playwright/test";

test("booking submission exposes pending state and renders the API result", async ({ page }) => {
  await page.route("**/api/bookings/", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const request = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        public_id: "booking-e2e",
        date: request.date,
        time: request.time,
        party_size: request.party_size,
        status: "pending",
      },
    });
  });

  await page.goto("/booking");
  await page.getByPlaceholder("Your name *").fill("Alex Guest");
  await page.getByPlaceholder("Email *").fill("alex@example.com");
  await page.locator('input[type="date"]').fill("2030-01-15");
  await page.locator('input[type="time"]').fill("18:30");
  await page.getByRole("button", { name: "Request a Table" }).click();

  const pending = page.getByRole("button", { name: "Sending…" });
  await expect(pending).toBeDisabled();
  await expect(page.getByText("Request received, Alex!")).toBeVisible();
});

test("review submission surfaces an API validation error", async ({ page }) => {
  await page.route("**/api/reviews/", (route) =>
    route.fulfill({ status: 400, json: { quote: ["Please add a little more detail."] } }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Leave a Guestbook Note" }).click();
  await page.getByPlaceholder("Your name *").fill("Alex");
  await page.getByPlaceholder(/Suburb/).fill("Geelong West");
  await page.locator(".rev-form textarea").fill("Nice");
  await page.getByRole("button", { name: /Post to Guestbook/ }).click();

  await expect(page.getByText("Please add a little more detail.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Post to Guestbook/ })).toBeEnabled();
});

test("order polling distinguishes server failure from a missing order and can retry", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/api/orders/error-order/", async (route) => {
    attempts += 1;
    if (attempts < 3) {
      return route.fulfill({ status: 503, json: { detail: "Kitchen status service unavailable." } });
    }
    return route.fulfill({ status: 404, json: { detail: "Not found." } });
  });

  await page.goto("/order/success?order=error-order");
  await expect(page.getByText("Status temporarily unavailable")).toBeVisible();
  await expect(page.getByText("Kitchen status service unavailable.")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("main").getByRole("heading", { name: "Order Lookup", level: 2 }),
  ).toBeVisible();
});
