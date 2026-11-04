import { type APIRequestContext, expect, test } from "@playwright/test";
import { APP_URL } from "./helpers";

for (const path of ["/", "/news", "/events", "/bookings", "/documents"]) {
  test(`${path} renders without errors`, async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));

    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("/news lists articles", async ({ page }) => {
  await page.goto("/news");

  await expect(page.locator("a[href^='/news/']").first()).toBeVisible();
});

test("the error page renders with the layout", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in" }).first(),
  ).toBeVisible();
});

test("client side navigation works", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByText("News", { exact: true }).first().hover();
  await page.locator("header a[href*='news']:visible").first().click();

  await expect(page).toHaveURL(/\/news/);
  await expect(page).toHaveTitle(/News/);
});

test.describe("CSRF protection", () => {
  const submitForm = (request: APIRequestContext, origin: string) =>
    request.post(`${APP_URL}/onboarding?/update`, {
      form: { firstName: "CSRF" },
      headers: { origin },
    });

  test("rejects form submissions from other origins", async ({ request }) => {
    const response = await submitForm(request, "https://evil.example");
    expect(response.status()).toBe(403);
  });

  test("lets through form submissions from our origin", async ({ request }) => {
    const response = await submitForm(request, APP_URL);
    expect(response.status()).not.toBe(403);
  });
});
