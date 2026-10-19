import { expect, test, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { Cookies } from "@sveltejs/kit";
import { actions } from "./+page.server";
import type { RequestEvent } from "./$types";

const submitOnboarding = async (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);

  const update = vi.fn();
  const event = {
    request: new Request("http://localhost/onboarding?/update", {
      method: "POST",
      body: formData,
    }),
    locals: {
      user: { studentId: "ab1234cd-s" },
      prisma: { member: { update } },
    },
    cookies: mockDeep<Cookies>(),
  } as unknown as RequestEvent;

  // the action redirects to the home page on success
  await expect(actions["update"]!(event)).rejects.toMatchObject({
    status: 303,
  });
  expect(update).toHaveBeenCalledOnce();
  return update.mock.calls[0]![0];
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
  const { data } = await submitOnboarding(submittedFields);
  expect(data).not.toHaveProperty("email");
  expect(data).not.toHaveProperty("nickname");
});

test("onboarding saves the submitted fields", async () => {
  const { where, data } = await submitOnboarding(submittedFields);
  expect(where).toEqual({ studentId: "ab1234cd-s" });
  expect(data).toMatchObject({
    ...submittedFields,
    classYear: new Date().getFullYear(),
  });
});
