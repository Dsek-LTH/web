import { expect, test, beforeAll, afterAll } from "vitest";
import { type MockProxy, mockDeep } from "vitest-mock-extended";
import { GET } from "./+server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const TEST_ID = uuid();
const TEST_EMAIL = TEST_ID + "@user.dsek.se";
const TEST_EMAIL_ALIAS = TEST_ID + "alias@dsek.se";
const TEST_SPECIAL_EMAIL_ALIAS = TEST_ID + "special-alias@dsek.se";

type RequestEvent = Parameters<typeof GET>[0];
let mockEvent: MockProxy<RequestEvent>;
beforeAll(async () => {
  await prisma.emailAlias.create({
    data: {
      email: TEST_EMAIL_ALIAS,
      position: {
        create: {
          id: TEST_ID,
          name: TEST_ID,
          mandates: {
            create: {
              id: TEST_ID,
              startDate: new Date(),
              endDate: dayjs().add(1, "hour").toDate(),
              lastSynced: new Date("1970"),
              member: {
                create: {
                  studentId: TEST_ID,
                  firstName: TEST_ID,
                  lastName: TEST_ID,
                  email: TEST_EMAIL,
                },
              },
            },
          },
        },
      },
    },
  });

  await prisma.specialReceiver.create({
    data: {
      email: TEST_SPECIAL_EMAIL_ALIAS,
      targetEmail: TEST_EMAIL,
    },
  });

  mockEvent = mockDeep<RequestEvent>({
    fallbackMockImplementation: () => [],
  });
  mockEvent.locals.prisma = prisma;
});

afterAll(async () => {
  await prisma.specialReceiver.deleteMany({
    where: { email: TEST_SPECIAL_EMAIL_ALIAS },
  });
  await prisma.emailAlias.deleteMany({
    where: { email: TEST_EMAIL_ALIAS },
  });
  await prisma.mandate.deleteMany({
    where: { positionId: TEST_ID },
  });
  await prisma.position.deleteMany({
    where: { id: TEST_ID },
  });
  await prisma.member.deleteMany({
    where: { studentId: TEST_ID },
  });
});

test("email alias list is not empty", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).not.toHaveLength(0);
});

test("email alias list contains alias", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_EMAIL_ALIAS);
});

test("email alias list adds root@dsek.se to empty alias", async () => {
  const mandate = await prisma.mandate.delete({ where: { id: TEST_ID } });
  const response = await GET(mockEvent);
  await prisma.mandate.create({ data: mandate });
  const body = await response.text();
  expect(body).toContain("root@dsek.se");
});

test("email alias list contains alias receiver", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_EMAIL_ALIAS + " " + TEST_EMAIL);
});

test("email alias list contains special alias receiver", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_SPECIAL_EMAIL_ALIAS + " " + TEST_EMAIL);
});
