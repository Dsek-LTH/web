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
  const edit = `${new URL(page.url()).pathname}/edit`;

  await page.goto("/news");
  await expect(
    page.getByText(header).filter({ visible: true }).first(),
  ).toBeVisible();

  // Saving it again leaves it published: a live article isn't shown as
  // scheduled, and saving without a schedule doesn't make it a draft.
  await page.goto(edit);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForURL(/\/news\/e2e-article-\d+$/);
  await page.goto(edit);
  await expect(
    page.getByRole("checkbox", { name: "Schedule publishing" }),
  ).not.toBeChecked();
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

test("create and edit a nollning season", async ({ page }) => {
  // A year no seeded season uses.
  const year = 2090 + (Date.now() % 9);
  await page.goto("/admin/settings");
  const create = page.locator('form[action="?/saveSeason"]').first();
  await create.locator('input[name="year"]').fill(String(year));
  await create
    .locator('input[name="nollaStartAt"]')
    .fill(`${year}-08-20T10:00`);
  await create.locator('input[name="revealAt"]').fill(`${year}-08-27T14:00`);
  await create.locator('input[name="endAt"]').fill(`${year}-09-20T23:00`);
  await create.getByRole("button").click();
  await expect(page.getByText(`Nollning ${year} created`)).toBeVisible();

  // Its own row, with the times as entered: seasons are newest first, and
  // no other season is this late, so it's the one after the "new" form.
  const row = page.locator('form[action="?/saveSeason"]').nth(1);
  await expect(row.locator('input[name="year"]')).toHaveValue(String(year));
  await expect(row.locator('input[name="revealAt"]')).toHaveValue(
    `${year}-08-27T14:00`,
  );
  await row.locator('input[name="endAt"]').fill(`${year}-09-21T23:00`);
  await row.getByRole("button").click();
  await expect(page.getByText(`Nollning ${year} saved`)).toBeVisible();
  await page.reload();
  await expect(row.locator('input[name="endAt"]')).toHaveValue(
    `${year}-09-21T23:00`,
  );
});
