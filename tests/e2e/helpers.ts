import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { expect, type Page } from "@playwright/test";

export const APP_URL = "http://localhost:4173";
export const FAKE_OIDC_URL = "http://localhost:4455";

/** Rows created by these tests use this prefix, so they can be cleaned up. */
export const E2E_PREFIX = "e2e-";

export const prisma = new PrismaClient();

type FakeOidcEvent = {
  type:
    | "authorize"
    | "refresh"
    | "tokens-issued"
    | "end-session"
    | "ticket-service";
  idToken?: string;
  authorization?: string;
};

const callFakeOidc = async (path: string, body?: unknown) => {
  const response = await fetch(`${FAKE_OIDC_URL}${path}`, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  expect(response.ok).toBe(true);
  return response;
};

/** Changes the fake identity provider for requests from now on. */
export const updateFakeOidc = (options: {
  user?: { studentId: string; groups: string[] };
  tokenLifetimeSeconds?: number;
  failRefresh?: boolean;
}) => callFakeOidc("/__test/update", options);

export const getFakeOidcEvents = async (): Promise<FakeOidcEvent[]> =>
  (await callFakeOidc("/__test/events")).json();

export const createOnboardedMember = async () => {
  const studentId = `${E2E_PREFIX}${randomUUID().slice(0, 8)}`;
  await prisma.member.create({
    data: {
      studentId,
      firstName: "E2E",
      lastName: "User",
      classProgramme: "D",
      classYear: 2024,
    },
  });
  return studentId;
};

/** Goes through the real sign in flow against the fake identity provider. */
export const signIn = async (
  page: Page,
  studentId: string,
  {
    groups = [],
    tokenLifetimeSeconds = 3600,
  }: { groups?: string[]; tokenLifetimeSeconds?: number } = {},
) => {
  await callFakeOidc("/__test/reset", {
    user: { studentId, groups },
    tokenLifetimeSeconds,
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).first().click();
  await expect(
    page.getByRole("button", { name: "Sign in" }).first(),
  ).toBeHidden();
};
