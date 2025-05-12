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
      canSend: true,
      position: {
        create: {
          id: TEST_ID,
          name: TEST_ID,
          mandates: {
            create: {
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

  await prisma.specialSender.create({
    data: {
      email: TEST_SPECIAL_EMAIL_ALIAS,
      studentId: TEST_ID,
    },
  });

  mockEvent = mockDeep<RequestEvent>({
    fallbackMockImplementation: () => [],
  });
  mockEvent.locals.prisma = prisma;
});

afterAll(async () => {
  await prisma.specialSender.deleteMany({
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

test("sender email alias list is not empty", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).not.toHaveLength(0);
});

test("sender email alias list contains alias", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_EMAIL_ALIAS);
});

test("sender email alias list contains alias sender", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_EMAIL_ALIAS + " " + TEST_ID);
});

test("sender email alias list contains special alias sender", async () => {
  const response = await GET(mockEvent);
  const body = await response.text();
  expect(body).toContain(TEST_SPECIAL_EMAIL_ALIAS + " " + TEST_ID);
});
