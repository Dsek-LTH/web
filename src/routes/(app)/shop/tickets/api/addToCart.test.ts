import { PrismaClient, type Member } from "@prisma/client";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { addTicketToCart } from "./addToCart";
import { GRACE_PERIOD_WINDOW, type ShopIdentification } from "./types";

import { enhance } from "@zenstackhq/runtime";
import { getAccessPolicies } from "../../../../../hooks.server.helpers";
import {
  addMockTickets,
  addMockUsers,
  removeMockTickets,
  removeMockUsers,
  type MockTickets,
} from "./mock";
const prisma = new PrismaClient();

const expectConsumableCount = async (shoppableId: string, count: number) =>
  expect(
    (
      await prisma.consumable.findMany({
        where: {
          shoppableId: shoppableId,
        },
      })
    ).length,
  ).toBe(count);
const expectReservationCount = async (shoppableId: string, count: number) =>
  expect(
    (
      await prisma.consumableReservation.findMany({
        where: {
          shoppableId: shoppableId,
        },
      })
    ).length,
  ).toBe(count);

const addTicketsTestForUser = (
  prismaWithAccess: PrismaClient,
  adminMember: Member,
  identification: ShopIdentification,
) => {
  let tickets: MockTickets;
  beforeEach(async () => {
    tickets = await addMockTickets(prisma, adminMember);
  });
  afterEach(async () => {
    const ticketIds = Object.values(tickets).map((t) => t.id);
    await removeMockTickets(prisma, ticketIds);
  });

  describe("post-grace, no queue", () => {
    it("adds a valid ticket request", async () => {
      const ticket = tickets.activeTicket;
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      const consumables = await prisma.consumable.findMany({
        where: {
          shoppableId: ticket.id,
        },
      });
      expect(consumables.length).toBe(1);
      expect(consumables[0]).toBeDefined();
      expect(consumables[0]!.memberId).toBe(identification.memberId ?? null);
      expect(consumables[0]!.externalCustomerCode).toBe(
        identification.externalCode ?? null,
      );
      expect(consumables[0]!.shoppableId).toBe(ticket.id);
      expect(consumables[0]!.purchasedAt).toBeNull();
      expect(consumables[0]!.externalCustomerEmail).toBeNull();
      expect(consumables[0]!.consumedAt).toBeNull();
    });
    it("doesn't add a ticket twice to cart", async () => {
      const ticket = tickets.activeTicket;
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectConsumableCount(ticket.id, 1);
      await expectReservationCount(ticket.id, 0);
    });
    it("doesn't add an upcoming ticket to cart", async () => {
      const ticket = tickets.upcomingTicket;
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectConsumableCount(ticket.id, 0);
      await expectReservationCount(ticket.id, 0);
    });
    it("doesn't add a past ticket to cart", async () => {
      const ticket = tickets.pastTicket;
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectConsumableCount(ticket.id, 0);
      await expectReservationCount(ticket.id, 0);
    });
  });

  describe("during grace period", () => {
    it("reserves a ticket", async () => {
      const ticket = tickets.activeEarlyTicket;
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      await expectConsumableCount(ticket.id, 0);
      const reservations = await prisma.consumableReservation.findMany({
        where: {
          shoppableId: ticket.id,
        },
      });
      expect(reservations.length).toBe(1);
      expect(reservations[0]).toBeDefined();
      expect(reservations[0]!.memberId).toBe(identification.memberId ?? null);
      expect(reservations[0]!.externalCustomerCode).toBe(
        identification.externalCode ?? null,
      );
      expect(reservations[0]!.shoppableId).toBe(ticket.id);
      expect(reservations[0]?.order).toBeNull();
    });
    it("doesn't reserve twice", async () => {
      const ticket = tickets.activeEarlyTicket;
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectReservationCount(ticket.id, 1);
    });
  });

  describe("post-grace, with items in other's carts", () => {
    beforeEach(async () => {
      const ticket = tickets.activeTicket;
      await prisma.consumable.createMany({
        data: [
          ...new Array(5).fill(0).map(() => ({
            shoppableId: ticket.id,
            memberId: adminMember.id, // duplicates, but that's fine
            purchasedAt: new Date(),
          })),
          ...new Array(5).fill(0).map(() => ({
            shoppableId: ticket.id,
            memberId: adminMember.id, // duplicates, but that's fine
          })),
        ],
      });
    });

    it("adds reservation if all available tickets are in cart(s)", async () => {
      const ticket = tickets.activeTicket;
      await expectConsumableCount(ticket.id, 10);
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      await expectConsumableCount(ticket.id, 10);
      const reservations = await prisma.consumableReservation.findMany({
        where: {
          shoppableId: ticket.id,
        },
      });
      expect(reservations.length).toBe(1);
      expect(reservations[0]?.memberId).toBe(identification.memberId ?? null);
      expect(reservations[0]?.externalCustomerCode).toBe(
        identification.externalCode ?? null,
      );
      expect(reservations[0]?.shoppableId).toBe(ticket.id);
      expect(reservations[0]?.order).toBe(0);
    });

    it("doesn't add sold out ticket", async () => {
      const ticket = tickets.activeTicket;
      await prisma.consumable.updateMany({
        data: {
          shoppableId: ticket.id,
          memberId: adminMember.id, // duplicates, but that's fine
          purchasedAt: new Date(),
        },
      });
      await expectConsumableCount(ticket.id, 10);
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectConsumableCount(ticket.id, 10);
      await expectReservationCount(ticket.id, 0);
    });

    it("expires un-purchased consumables", async () => {
      const ticket = tickets.activeTicket;
      await prisma.consumable.updateMany({
        where: {
          shoppableId: ticket.id,
        },
        data: {
          expiresAt: new Date(Date.now() - 1000),
        },
      });
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      const consumables = await prisma.consumable.findMany({
        where: {
          shoppableId: ticket.id,
        },
      });
      expect(consumables.length).toBe(6);
      expect(
        consumables.filter((c) => c.memberId === adminMember.id).length,
      ).toBe(5); // purchased ones left
      await expectReservationCount(ticket.id, 0);
    });
  });
  describe("post-grace, with queue", () => {
    beforeEach(async () => {
      const ticket = tickets.activeTicket;
      await prisma.consumable.createMany({
        data: [
          ...new Array(5).fill(0).map(() => ({
            shoppableId: ticket.id,
            memberId: adminMember.id, // duplicates, but that's fine
            purchasedAt: new Date(),
          })),
          ...new Array(5).fill(0).map(() => ({
            shoppableId: ticket.id,
            memberId: adminMember.id, // duplicates, but that's fine
          })),
        ],
      });
      await prisma.consumableReservation.create({
        data: {
          shoppableId: ticket.id,
          memberId: adminMember.id,
          order: 0,
        },
      });
    });
    it("places new reservation last after initial lottery", async () => {
      const ticket = tickets.activeTicket;
      await expectConsumableCount(ticket.id, 10);
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      await expectConsumableCount(ticket.id, 10);
      const reservations = await prisma.consumableReservation.findMany({
        where: {
          shoppableId: ticket.id,
        },
      });
      expect(reservations.length).toBe(2);
      expect(reservations[0]?.memberId).toBe(adminMember.id);
      expect(reservations[0]?.order).toBe(0);
      expect(reservations[1]?.memberId).toBe(identification.memberId ?? null);
      expect(reservations[1]?.externalCustomerCode).toBe(
        identification.externalCode ?? null,
      );
      expect(reservations[1]?.shoppableId).toBe(ticket.id);
      expect(reservations[1]?.order).toBe(1);
    });
  });

  describe("right after grace period", () => {
    beforeEach(async () => {
      const start = tickets.activeEarlyTicket.shoppable.availableFrom;
      vi.useFakeTimers();
      vi.setSystemTime(start);
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    it("performs lottery after grace period", async () => {
      const ticket = tickets.activeEarlyTicket;
      await addTicketToCart(prismaWithAccess, ticket.id, identification);
      await expectConsumableCount(ticket.id, 0);
      await expectReservationCount(ticket.id, 1);

      vi.advanceTimersByTime(GRACE_PERIOD_WINDOW / 2);
      vi.setSystemTime(
        vi.getMockedSystemTime()!.valueOf() + GRACE_PERIOD_WINDOW / 2,
      );
      try {
        await addTicketToCart(prismaWithAccess, ticket.id, identification);
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      await expectConsumableCount(ticket.id, 0);
      await expectReservationCount(ticket.id, 1);

      vi.advanceTimersByTime(GRACE_PERIOD_WINDOW / 2);
      const timeAfter =
        vi.getMockedSystemTime()!.valueOf() + GRACE_PERIOD_WINDOW / 2;
      vi.setSystemTime(timeAfter);
      vi.useRealTimers();
      vi.setSystemTime(timeAfter);
      await new Promise((resolve) => setTimeout(resolve, 20)); // to allow for the transaction to finish
      console.log("checking");
      await expectReservationCount(ticket.id, 0);
      await expectConsumableCount(ticket.id, 1);
    });

    // it("ensures users adding after grace period are placed last", async () => {});
  });
};

describe("Add to cart as logged in user", async () => {
  const users = await addMockUsers(prisma);
  afterAll(async () => {
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });

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
  addTicketsTestForUser(prismaWithAccess, users.adminMember, {
    memberId: users.customerMember.id,
  });
});
describe("Add to cart as anonymous user", async () => {
  const users = await addMockUsers(prisma);
  afterAll(async () => {
    await removeMockUsers(
      prisma,
      Object.values(users).map((u) => u.id),
    );
  });

  const prismaWithAccess = enhance(prisma, {
    user: {
      studentId: undefined,
      memberId: undefined,
      policies: [],
      externalCode: "external-code",
    },
  });
  addTicketsTestForUser(prismaWithAccess, users.adminMember, {
    externalCode: "external-code",
  });
});
