import { expect, test } from "@playwright/test";

test("booking submission exposes pending state and renders the API result", async ({ page }) => {
  let submitted = false;
  await page.route("**/api/bookings/", async (route) => {
    submitted = true;
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
        email_delivery: "failed",
      },
    });
  });

  await page.goto("/booking");
  await page.getByPlaceholder("Your name *").fill("Alex Guest");
  await page.getByPlaceholder("Email *").fill("alex@example.com");
  await page.locator('input[type="date"]').fill("2030-01-15");
  await page.locator('input[type="time"]').fill("18:30");

  await page.getByRole("button", { name: "Request a Table" }).click();
  await expect(page.getByPlaceholder("Phone *")).toBeFocused();
  expect(submitted).toBe(false);

  await page.getByPlaceholder("Phone *").fill("0412 345 678");
  await page.getByRole("button", { name: "Request a Table" }).click();

  const pending = page.getByRole("button", { name: "Sending…" });
  await expect(pending).toBeDisabled();
  await expect(page.getByText("Request received, Alex!")).toBeVisible();
  await expect(page.getByText(/request is saved, but we couldn't send/i)).toBeVisible();
});

test("order checkout requires an email and sends it to the API", async ({ page }) => {
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/orders/", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        public_id: "order-email-e2e",
        status: "received",
        payment_status: "unpaid",
        subtotal: "17.00",
        discount_amount: "0.00",
        total: "17.00",
        items: [],
        checkout_url: "",
        email_delivery: "failed",
      },
    });
  });
  await page.route("**/api/orders/order-email-e2e/", (route) =>
    route.fulfill({
      status: 200,
      json: {
        public_id: "order-email-e2e",
        customer_name: "Alex Guest",
        status: "received",
        payment_status: "unpaid",
        subtotal: "17.00",
        coupon_code: "",
        discount_amount: "0.00",
        total: "17.00",
        items: [],
      },
    }),
  );

  await page.goto("/menu");
  const firstDishHref = await page.locator(".diner-dish-row .dc-details").first().getAttribute("href");
  const firstDishSlug = firstDishHref?.split("/").pop();
  expect(firstDishSlug).toBeTruthy();
  await page.goto(`/menu?add=${encodeURIComponent(firstDishSlug!)}`);
  await expect(page.getByRole("complementary", { name: "Shopping cart" })).toHaveClass(/open/);
  await page.locator("#cart-customer-name").fill("Alex Guest");
  await page.locator("#cart-customer-phone").fill("0412 345 678");

  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.locator("#cart-customer-email-error")).toHaveText(
    "Email is required for order updates.",
  );
  expect(submitted).toBeNull();

  await page.locator("#cart-customer-email").fill("alex@example.com");
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect.poll(() => submitted).not.toBeNull();
  expect(submitted).toMatchObject({
    customer_name: "Alex Guest",
    email: "alex@example.com",
    phone: "0412 345 678",
  });
  await expect(page.getByText(/order is saved, but we couldn't send/i)).toBeVisible();
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
