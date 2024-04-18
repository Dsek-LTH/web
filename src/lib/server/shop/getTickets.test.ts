import { PrismaClient, type Member } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import { afterAll, describe, expect, it } from "vitest";
import { getAccessPolicies } from "../../../hooks.server.helpers";
import { getTickets } from "./getTickets";
import {
  addMockTickets,
  addMockUsers,
  removeAllTestData,
  removeMockTickets,
  removeMockUsers,
} from "./mock";
const prisma = new PrismaClient();
const SUITE_PREFIX = "getTickets";

const getTicketsTest = async (
  prismaWithAccess: PrismaClient,
  adminMember: Member,
) => {
  it("should get all tickets", async () => {
    const tickets = await addMockTickets(prisma, adminMember);
    const result = await getTickets(prismaWithAccess);
    const ticketIds = Object.values(tickets).map((t) => t.id);
    const filteredResult = result.filter((t) => ticketIds.includes(t.id));
    expect(filteredResult.length).toBe(5);
    // in order of available from (earliest first)
    expect(filteredResult).toEqual([
      tickets.pastTicket,
      tickets.activeTicket,
      tickets.activeTicket2,
      tickets.activeEarlyTicket,
      tickets.upcomingTicket,
    ]);
    await removeMockTickets(prisma, ticketIds);
  });
};
describe("Get tickets as logged in user", async () => {
  const users = await addMockUsers(prisma, SUITE_PREFIX);
  const prismaWithAccess = enhance(prisma, {
    user: {
      studentId: users.customerMember.studentId,
      memberId: users.customerMember.id,
      policies: await getAccessPolicies(
        prisma,
        users.customerMember.studentId!,
      ),
    },
  });
  afterAll(async () => {
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });
  getTicketsTest(prismaWithAccess, users.adminMember);
});
describe("Get tickets as anonymous user", async () => {
  const users = await addMockUsers(prisma, SUITE_PREFIX);
  const prismaWithAccess = enhance(prisma, {
    user: {
      studentId: users.customerMember.studentId,
      memberId: users.customerMember.id,
      policies: await getAccessPolicies(
        prisma,
        users.customerMember.studentId!,
      ),
    },
  });
  afterAll(async () => {
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });
  getTicketsTest(prismaWithAccess, users.adminMember);
});

afterAll(async () => {
  await removeAllTestData(prisma, SUITE_PREFIX);
  prisma.$disconnect();
});
