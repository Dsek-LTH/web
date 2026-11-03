import { expect, test } from "@playwright/test";
import sharp from "sharp";
import {
  APP_URL,
  createOnboardedMember,
  E2E_PREFIX,
  prisma,
  signIn,
} from "./helpers";

test.describe("superforms", () => {
  // Onboarding uses $derived(superForm(...)), which superforms 3 breaks here by
  // removing the whole form
  test("a rejected submission shows the error and saves nothing", async ({
    page,
  }) => {
    const studentId = `${E2E_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
    await signIn(page, studentId);
    await expect(page).toHaveURL(/\/onboarding$/);

    const year = page.locator("input[name=classYear]");
    await year.fill("1900");
    // Get past the browser's validation, to reach the server's
    await year.evaluate((input) => input.removeAttribute("min"));
    await page.locator("input[name=firstName]").fill("Rejected");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(year).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/onboarding$/);
    const member = await prisma.member.findUnique({ where: { studentId } });
    expect(member?.firstName).not.toBe("Rejected");
    expect(member?.classYear).not.toBe(1900);
  });

  test("a valid submission saves and redirects", async ({ page }) => {
    const studentId = `${E2E_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
    await signIn(page, studentId);
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.locator("input[name=firstName]").fill("Accepted");
    await page.locator("input[name=lastName]").fill("Member");
    await page.locator("input[name=classYear]").fill("2024");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page).toHaveURL(`${APP_URL}/home`);
    const member = await prisma.member.findUnique({ where: { studentId } });
    expect(member?.firstName).toBe("Accepted");
    expect(member?.classYear).toBe(2024);
  });
});

test.describe("remote functions", () => {
  test("a remote form saves the settings", async ({ page }) => {
    await signIn(page, await createOnboardedMember());
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const toggle = page.getByRole("switch").first();
    const before = await toggle.getAttribute("aria-checked");
    const expected = before === "true" ? "false" : "true";
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", expected);
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes("/remote/") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await saved;

    await page.reload();
    await expect(page.getByRole("switch").first()).toHaveAttribute(
      "aria-checked",
      expected,
    );
  });
});

test.describe("profile picture", () => {
  test("cropping an image fills in the crop area", async ({ page }) => {
    const studentId = await createOnboardedMember();
    await signIn(page, studentId);
    await page.goto(`/members/${studentId}/edit`);

    const image = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: "#f280a1",
      },
    })
      .png()
      .toBuffer();
    await page.locator("input[name=image]").setInputFiles({
      name: "picture.png",
      mimeType: "image/png",
      buffer: image,
    });

    await expect(page.locator("input[name=cropWidth]")).not.toHaveValue(
      /^(0?)$/,
    );
    await expect(page.locator("input[name=cropHeight]")).not.toHaveValue(
      /^(0?)$/,
    );
  });
});
