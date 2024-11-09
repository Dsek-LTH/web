import { beforeEach, expect, test } from "vitest";
import { type MockProxy, mockDeep } from "vitest-mock-extended";
import { GET } from "./+server";
import { BACKUP_LIST_OF_STUDENT_IDS } from "./constants";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";

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
  const body = await response.text();
  expect(body).not.toHaveLength(0);
});

test("door access list contains backup students", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(BACKUP_LIST_OF_STUDENT_IDS.join("\n"));
});

test("door access list does not contain banned students", async () => {
  // TO-DO: improve this test, since it fails if there
  // are no members in the database, which is not great.
  const randomMember = await authorizedPrismaClient.member.findFirst({
    select: { studentId: true },
  });
  if (!randomMember) {
    throw new Error("No members found");
  }

  const policy = await authorizedPrismaClient.doorAccessPolicy.create({
    data: {
      doorName: "idet",
      isBan: true,
      studentId: randomMember.studentId,
    },
  });
  const response = await GET(mockEvent);
  const body = await response.text();
  const studentIds = body.split("\n");

  expect(studentIds).not.toContain(randomMember.studentId);

  await authorizedPrismaClient.doorAccessPolicy.delete({
    where: { id: policy.id },
  });
});
