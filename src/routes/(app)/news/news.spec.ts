import { expect, test } from "@playwright/test";

test.describe("/news", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/news");
	});

	test("/ shows articles", async ({ page }) => {
		const articles = await page.getByRole("article").all();
		expect(articles).not.toHaveLength(0);
	});
});
