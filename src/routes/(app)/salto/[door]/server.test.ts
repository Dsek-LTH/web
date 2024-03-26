import { beforeEach, expect, test } from "vitest";
import { type MockProxy, mockDeep } from "vitest-mock-extended";
import { GET } from "./+server";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";

type RequestEvent = Parameters<typeof GET>[0];
let mockEvent: MockProxy<RequestEvent>;
beforeEach(() => {
  mockEvent = mockDeep<RequestEvent>({
    fallbackMockImplementation: () => [],
  });
  mockEvent.params.door = "idet";
});

test("door access list is not empty", async () => {
  const response = await GET(mockEvent);
  const body = await response.json();
  expect(body).not.toHaveLength(0);
});

test("door access list contains backup students", async () => {
  const response = await GET(mockEvent);
  const body = await response.json();
  expect(body).toEqual(expect.arrayContaining(BACKUP_LIST_OF_STUDENT_IDS));
});
