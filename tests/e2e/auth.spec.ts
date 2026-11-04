import { expect, test } from "@playwright/test";
import {
  APP_URL,
  createOnboardedMember,
  E2E_PREFIX,
  getFakeOidcEvents,
  prisma,
  signIn,
  updateFakeOidc,
} from "./helpers";

const ALERT_POLICY = "alert";

test("signing in creates a session", async ({ page }) => {
  await signIn(page, await createOnboardedMember());

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  const events = await getFakeOidcEvents();
  expect(events.map((event) => event.type)).toContain("authorize");
});

test("a first time user is sent to onboarding", async ({ page }) => {
  const studentId = `${E2E_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
  await signIn(page, studentId);

  await expect(page).toHaveURL(/\/onboarding$/);
  const member = await prisma.member.findUnique({ where: { studentId } });
  expect(member?.email).toBe(`${studentId}@student.example`);
});

test("signing out ends the session at the identity provider too", async ({
  page,
}) => {
  await signIn(page, await createOnboardedMember());

  await page.locator("[data-link-preview-trigger]").first().hover();
  await page.getByRole("button", { name: "sign out" }).click();

  await expect(page).toHaveURL(/\/end-session\/$/);
  const events = await getFakeOidcEvents();
  expect(events.map((event) => event.type)).toContain("end-session");

  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Sign in" }).first(),
  ).toBeVisible();
});

test("an expired token is refreshed, picking up changed groups", async ({
  page,
}) => {
  const role = `${E2E_PREFIX}${crypto.randomUUID().slice(0, 8)}`;
  // The seed gives everyone access to everything, which is restored below
  const seeded = await prisma.accessPolicy.findMany({
    where: { apiName: ALERT_POLICY },
  });
  await prisma.accessPolicy.deleteMany({ where: { apiName: ALERT_POLICY } });
  await prisma.accessPolicy.create({ data: { apiName: ALERT_POLICY, role } });

  try {
    const studentId = await createOnboardedMember();

    await signIn(page, studentId, { tokenLifetimeSeconds: 1 });
    // Checks the heading, since this error page is served with status 200
    const forbidden = page.getByRole("heading", { name: "403" });
    await page.goto("/admin/alerts");
    await expect(forbidden).toBeVisible();

    await updateFakeOidc({
      user: { studentId, groups: [role] },
      tokenLifetimeSeconds: 3600,
    });
    // The token above lasted a second, so the next request has to refresh it
    await page.waitForTimeout(1100);
    await page.goto("/admin/alerts");
    await expect(page.locator("input[name=messageSv]")).toBeVisible();
    await expect(forbidden).toBeHidden();

    const events = await getFakeOidcEvents();
    expect(events.map((event) => event.type)).toContain("refresh");
  } finally {
    await prisma.accessPolicy.deleteMany({
      where: { apiName: ALERT_POLICY },
    });
    await prisma.accessPolicy.createMany({ data: seeded });
  }
});

test("the refreshed id token is what other services get", async ({ page }) => {
  const studentId = await createOnboardedMember();
  await signIn(page, studentId, { tokenLifetimeSeconds: 1 });
  await updateFakeOidc({ tokenLifetimeSeconds: 3600 });
  await page.waitForTimeout(1100);

  await page.goto("/tickets/e2e-release");
  await page.goto("/tickets/e2e-release");

  const events = await getFakeOidcEvents();
  const latestIdToken = events
    .filter((event) => event.type === "tokens-issued")
    .at(-1)?.idToken;
  const forwarded = events
    .filter((event) => event.type === "ticket-service")
    .at(-1)?.authorization;
  expect(events.map((event) => event.type)).toContain("refresh");
  expect(latestIdToken).toBeDefined();
  expect(forwarded).toBe(`Bearer ${latestIdToken}`);
});

test("a failed token refresh signs the user out", async ({ page }) => {
  await signIn(page, await createOnboardedMember(), {
    tokenLifetimeSeconds: 1,
  });
  await updateFakeOidc({ failRefresh: true });
  await page.waitForTimeout(1100);

  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Sign in" }).first(),
  ).toBeVisible();
});

test("login doesn't redirect to lookalike domains", async ({ page }) => {
  const studentId = await createOnboardedMember();
  await signIn(page, studentId);
  await page.context().clearCookies();
  await page.goto("/");

  // The same request that the sign in button makes, with a hostile target. This
  // is the one test tied to the Auth.js endpoints.
  const response = await page.request.post(`${APP_URL}/auth/signin/authentik`, {
    form: { callbackUrl: "https://evildsek.se/" },
    headers: { origin: APP_URL, "x-auth-return-redirect": "1" },
  });
  expect(response.ok()).toBe(true);

  const { url } = await response.json();
  await page.goto(url);

  await expect(page).toHaveURL(new RegExp(`^${APP_URL}`));
});
