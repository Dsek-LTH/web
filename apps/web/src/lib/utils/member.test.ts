import { beforeEach, expect, test, vi } from "vitest";
import type { serverApi } from "$lib/server/apiClient";
import { setNollningGroup } from "./member";

const GROUP = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

let current: { nollningGroupId?: string } = {};
const api = {
  GET: vi.fn(async () => ({ data: current })),
  PUT: vi.fn(async () => ({ data: undefined }) as Record<string, unknown>),
};
const client = api as unknown as ReturnType<typeof serverApi>;

beforeEach(() => {
  current = {};
  api.GET.mockClear();
  api.PUT.mockClear();
});

test("an unposted field changes nothing", async () => {
  current = { nollningGroupId: GROUP };
  expect(await setNollningGroup(client, "ab1234cd-s", undefined)).toBeNull();
  expect(api.PUT).not.toHaveBeenCalled();
});

test("an unchanged group isn't sent", async () => {
  current = { nollningGroupId: GROUP };
  await setNollningGroup(client, "ab1234cd-s", GROUP);
  // A caller who can't see the group gets an empty select and posts null.
  current = {};
  await setNollningGroup(client, "ab1234cd-s", null);
  expect(api.PUT).not.toHaveBeenCalled();
});

test("a past season's group posted back unchanged isn't sent", async () => {
  // The select only offers this season's groups, but its hidden input
  // posts the prefilled id, so a plain save posts last year's group.
  current = { nollningGroupId: OTHER };
  expect(await setNollningGroup(client, "ab1234cd-s", OTHER)).toBeNull();
  expect(api.PUT).not.toHaveBeenCalled();
});

test("a passed profile is compared without fetching it", async () => {
  current = { nollningGroupId: OTHER };
  await setNollningGroup(client, "ab1234cd-s", GROUP, {
    nollningGroupId: GROUP,
  });
  expect(api.GET).not.toHaveBeenCalled();
  expect(api.PUT).not.toHaveBeenCalled();
  await setNollningGroup(client, "ab1234cd-s", null, {
    nollningGroupId: GROUP,
  });
  expect(api.GET).not.toHaveBeenCalled();
  expect(api.PUT).toHaveBeenCalledWith("/members/{studentId}/phadder-group", {
    params: { path: { studentId: "ab1234cd-s" } },
    body: {},
  });
});

test("a changed group is sent", async () => {
  current = { nollningGroupId: GROUP };
  await setNollningGroup(client, "ab1234cd-s", OTHER);
  await setNollningGroup(client, "ab1234cd-s", null);
  expect(api.PUT.mock.calls).toEqual([
    [
      "/members/{studentId}/phadder-group",
      {
        params: { path: { studentId: "ab1234cd-s" } },
        body: { groupId: OTHER },
      },
    ],
    [
      "/members/{studentId}/phadder-group",
      { params: { path: { studentId: "ab1234cd-s" } }, body: {} },
    ],
  ]);
});

test("Go's error is returned", async () => {
  api.PUT.mockResolvedValueOnce({
    error: { detail: "not in the current season" },
    response: { status: 422, statusText: "Unprocessable Entity" },
  });
  expect(await setNollningGroup(client, "ab1234cd-s", GROUP)).toEqual({
    status: 422,
    message: "not in the current season",
  });
});
