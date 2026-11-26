import { beforeEach, expect, test, vi } from "vitest";

const current = {
  id: "member-id",
  studentId: "ab1234cd-s",
  firstName: "Old",
  lastName: "Name",
  graduationYear: 2030,
};

const api = {
  GET: vi.fn(async () => ({ data: current })),
  PUT: vi.fn(async () => ({ data: {} })),
};

vi.mock("$lib/server/apiClient", () => ({ serverApi: () => api }));
vi.mock("$lib/utils/member", () => ({ setNollningGroup: vi.fn() }));

const profilePage = await import("../+page.server");
const editPage = await import("./+page.server");

beforeEach(() => {
  api.GET.mockClear();
  api.PUT.mockClear();
});

// The fields MemberForm submits; it has no graduation year input.
const submittedFields = {
  firstName: "Dennis",
  lastName: "Dsek",
  nickname: "Denne",
  birthDate: "2000-01-15",
  foodPreference: "",
  language: "sv",
  classProgramme: "D",
  classYear: String(new Date().getFullYear()),
  nollningGroupId: "",
  bio: "Hi",
};

// Both actions are called with a hand-built event, so they're typed loosely.
type AnyAction = (event: never) => unknown;

const submit = async (action: AnyAction): Promise<Record<string, unknown>> => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(submittedFields))
    formData.set(key, value);
  const event = {
    params: { studentId: "ab1234cd-s" },
    request: new Request("http://localhost/members/ab1234cd-s?/update", {
      method: "POST",
      body: formData,
    }),
  };
  try {
    await action(event as never);
  } catch {
    // the edit page redirects on success
  }
  const profileCall = (api.PUT.mock.calls as unknown[][]).find(
    ([path]) => path === "/members/{studentId}",
  );
  expect(profileCall).toBeDefined();
  return (profileCall![1] as { body: Record<string, unknown> }).body;
};

test("saving the profile modal keeps the graduation year", async () => {
  const body = await submit(profilePage.actions["update"] as AnyAction);
  expect(body).toMatchObject({
    firstName: "Dennis",
    graduationYear: current.graduationYear,
  });
});

test("saving the edit page keeps the graduation year", async () => {
  const body = await submit(editPage.actions["update"] as AnyAction);
  expect(body).toMatchObject({
    firstName: "Dennis",
    graduationYear: current.graduationYear,
  });
});
