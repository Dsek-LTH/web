import { beforeEach, expect, test, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Cookies } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

// Ported from upstream's Prisma-backed test (#1342): the action now talks
// to Go, so the API client is mocked instead of Prisma.

const current = {
  id: "member-id",
  studentId: "ab1234cd-s",
  firstName: "Old",
  lastName: "Name",
  nickname: "Nicky",
  bio: "Existing bio",
  graduationYear: 2030,
  language: "sv",
};

const api = {
  GET: vi.fn(async () => ({ data: current })),
  PUT: vi.fn(async () => ({ data: {} })),
};

vi.mock("$lib/server/apiClient", () => ({ serverApi: () => api }));
vi.mock("$lib/utils/member", () => ({ setNollningGroup: vi.fn() }));

const { actions } = await import("./+page.server");

beforeEach(() => {
  api.GET.mockClear();
  api.PUT.mockClear();
});

const submitOnboarding = async (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  const event = {
    request: new Request("http://localhost/onboarding?/update", {
      method: "POST",
      body: formData,
    }),
    locals: { user: { studentId: "ab1234cd-s" } },
    cookies: mockDeep<Cookies>(),
  } as unknown as RequestEvent;

  // the action redirects to the home page on success
  await expect(actions["update"]!(event)).rejects.toMatchObject({
    status: 303,
  });
  const profileCall = (api.PUT.mock.calls as unknown[][]).find(
    ([path]) => path === "/members/{studentId}",
  );
  expect(profileCall).toBeDefined();
  return profileCall![1] as {
    params: { path: { studentId: string } };
    body: Record<string, unknown>;
  };
};

// The fields submitted by the onboarding form. The email input is disabled
// and therefore never submitted.
const submittedFields = {
  firstName: "Dennis",
  lastName: "Dsek",
  foodPreference: "Vegetarian",
  classProgramme: "D",
  classYear: String(new Date().getFullYear()),
};

test("onboarding does not overwrite fields missing from the form", async () => {
  const { body } = await submitOnboarding(submittedFields);
  expect(body).not.toHaveProperty("email");
  expect(body).toMatchObject({
    nickname: current.nickname,
    bio: current.bio,
    graduationYear: current.graduationYear,
    language: current.language,
  });
});

test("onboarding saves the submitted fields", async () => {
  const { params, body } = await submitOnboarding(submittedFields);
  expect(params.path.studentId).toBe("ab1234cd-s");
  expect(body).toMatchObject({
    firstName: "Dennis",
    lastName: "Dsek",
    classProgramme: "D",
    classYear: new Date().getFullYear(),
  });
  expect(api.PUT).toHaveBeenCalledWith(
    "/members/{studentId}/food-preference",
    expect.objectContaining({ body: { foodPreference: "Vegetarian" } }),
  );
});
