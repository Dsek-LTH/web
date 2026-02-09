import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { mockDeep, type MockProxy } from "vitest-mock-extended";
import { GET } from "./+server";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";
import mockedPrisma from "$lib/server/__mocks__/authorizedPrisma";
import type { DoorAccessPolicy } from "@prisma/client";

type RequestEvent = Parameters<typeof GET>[0];
let mockEvent: MockProxy<RequestEvent>;

beforeAll(() => {
  vi.mock("lib/server/authorizedPrisma");
  return () => {
    vi.doUnmock("lib/server/authorizedPrisma");
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
  mockEvent = mockDeep<RequestEvent>({
    fallbackMockImplementation: () => [],
  });
  mockEvent.params.door = "idet";
});

test("door access list is not empty", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).not.toHaveLength(0);
});

test("door access list contains backup students", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(BACKUP_LIST_OF_STUDENT_IDS.join("\n"));
});

const mockedDoorAccessPolicy = [
  {
    role: "dsek",
    studentId: "notBanned",
    isBan: false,
  },
  {
    role: "dsek",
    studentId: "isBanned",
    isBan: true,
  },
];

test("door access list does not contain banned students", async () => {
  mockedPrisma.doorAccessPolicy.findMany.mockResolvedValue(
    mockedDoorAccessPolicy as DoorAccessPolicy[],
  );
  mockedPrisma.position.findMany.mockResolvedValue([]);
  mockedPrisma.mandate.findMany.mockResolvedValue([]);

  const response = await GET(mockEvent);
  const body = await response.text();
  const studentIds = body.split("\n");

  expect(studentIds).not.toContain("banned");
  expect(studentIds).toContain("notBanned");
});
