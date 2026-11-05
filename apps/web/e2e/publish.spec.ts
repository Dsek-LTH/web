import { expect, test } from "@playwright/test";

// Writing an article and an event through their forms: the SvelteKit
// action, the Go API and the redirect to the new page, end to end.

test("publish an article", async ({ page }) => {
  const header = `E2E article ${Date.now()}`;
  await page.goto("/news/create");
  await page.getByPlaceholder("Header").fill(header);
  await page
    .getByRole("textbox", { name: "Enter text here..." })
    .fill("The body of an article written by the end-to-end tests.");
  // A notification needs a tag; this one has neither.
  await page.getByRole("checkbox", { name: "Send notification?" }).uncheck();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/\/news\/e2e-article-\d+$/);
  await expect(page.getByRole("heading", { name: header })).toBeVisible();

  await page.goto("/news");
  await expect(
    page.getByText(header).filter({ visible: true }).first(),
  ).toBeVisible();
});

test("publish an event", async ({ page }) => {
  const title = `E2E event ${Date.now()}`;
  await page.goto("/events/create");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(title);
  await page
    .getByRole("textbox", { name: "Enter text here..." })
    .fill("The description of an event created by the end-to-end tests.");
  // The form defaults to the coming hour, so /events lists it.
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(/\/events\/e2e-event-\d+$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.goto("/events");
  await expect(
    page.getByText(title).filter({ visible: true }).first(),
  ).toBeVisible();
});
