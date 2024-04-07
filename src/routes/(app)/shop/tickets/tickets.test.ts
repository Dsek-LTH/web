import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { getAccessPolicies } from "../../../../hooks.server.helpers";
import { addMockTickets, removeMockTickets } from "./mock";
import { addTicketToCart, getTickets } from "./tickets";
const prisma = new PrismaClient();

let prismaWithAccess = enhance(prisma, {
  user: {
    studentId: undefined,
    memberId: undefined,
    policies: [],
  },
});
let tickets: Awaited<ReturnType<typeof addMockTickets>>;
afterAll(async () => {
  removeMockTickets(prisma);
});
beforeEach(async () => {
  tickets = await addMockTickets(prisma);
  prismaWithAccess = enhance(prisma, {
    user: {
      studentId: tickets.customerMember.studentId,
      memberId: tickets.customerMember.id,
      policies: await getAccessPolicies(
        prisma,
        tickets.customerMember.studentId!,
      ),
    },
  });
});
afterEach(async () => {
  await removeMockTickets(prisma);
});

describe("Get tickets", () => {
  it("should get all tickets", async () => {
    const result = await getTickets(prismaWithAccess);
    expect(result.length).toBe(4);
    // in order of available from (earliest first)
    expect(result).toEqual([
      tickets.pastTicket,
      tickets.activeTicket,
      tickets.activeEarlyTicket,
      tickets.upcomingTicket,
    ]);
  });
  it("anonymous should get all tickets", async () => {
    const result = await getTickets(
      enhance(prisma, {
        user: {
          studentId: undefined,
          memberId: undefined,
          policies: await getAccessPolicies(prisma),
          externalCode: "external-code",
        },
      }),
    );
    expect(result.length).toBe(4);
    // in order of available from (earliest first)
    expect(result).toEqual([
      tickets.pastTicket,
      tickets.activeTicket,
      tickets.activeEarlyTicket,
      tickets.upcomingTicket,
    ]);
  });
});
describe("Add tickets to cart", () => {
  afterEach(async () => {
    await prisma.consumable.deleteMany(); // remove all consumables
    await prisma.consumableReservation.deleteMany(); // remove all consumables
  });
  it("should add a valid ticket request", async () => {
    await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
      memberId: tickets.customerMember.id,
    });
    const consumables = await prisma.consumable.findMany();
    expect(consumables.length).toBe(1);
    expect(consumables[0]).toBeDefined();
    expect(consumables[0]!.memberId).toBe(tickets.customerMember.id);
    expect(consumables[0]!.shoppableId).toBe(tickets.activeTicket.shoppable.id);
    expect(consumables[0]!.purchasedAt).toBeNull();
    expect(consumables[0]!.externalCustomerCode).toBeNull();
    expect(consumables[0]!.externalCustomerEmail).toBeNull();
    expect(consumables[0]!.consumedAt).toBeNull();
  });
  it("should not add a ticket twice to cart", async () => {
    await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
      memberId: tickets.customerMember.id,
    });
    try {
      await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
        memberId: tickets.customerMember.id,
      });
      expect.fail();
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect((await prisma.consumable.findMany()).length).toBe(1);
    expect((await prisma.consumableReservation.findMany()).length).toBe(0);
  });
  it("should not add an upcoming ticket to cart", async () => {
    try {
      await addTicketToCart(prismaWithAccess, tickets.upcomingTicket.id, {
        memberId: tickets.customerMember.id,
      });
      expect.fail();
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect((await prisma.consumable.findMany()).length).toBe(0);
    expect((await prisma.consumableReservation.findMany()).length).toBe(0);
  });
  it("should not add a past ticket to cart", async () => {
    try {
      await addTicketToCart(prismaWithAccess, tickets.pastTicket.id, {
        memberId: tickets.customerMember.id,
      });
      expect.fail();
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect((await prisma.consumable.findMany()).length).toBe(0);
    expect((await prisma.consumableReservation.findMany()).length).toBe(0);
  });

  it("should reserve a ticket instead initially", async () => {
    await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
      memberId: tickets.customerMember.id,
    });
    const consumables = await prisma.consumable.findMany();
    expect(consumables.length).toBe(0);
    const reservations = await prisma.consumableReservation.findMany();
    expect(reservations.length).toBe(1);
    expect(reservations[0]).toBeDefined();
    expect(reservations[0]?.memberId).toBe(tickets.customerMember.id);
    expect(reservations[0]?.shoppableId).toBe(
      tickets.activeEarlyTicket.shoppable.id,
    );
    expect(reservations[0]?.order).toBeNull();
  });
  it("should not reserve twice", async () => {
    await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
      memberId: tickets.customerMember.id,
    });
    try {
      await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
        memberId: tickets.customerMember.id,
      });
      expect.fail();
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect((await prisma.consumableReservation.findMany()).length).toBe(1);
  });

  it("should add reservation if all available tickets are in someones cart", async () => {
    await prisma.consumable.createMany({
      data: [
        ...new Array(5).fill(0).map(() => ({
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
          purchasedAt: new Date(),
        })),
        ...new Array(5).fill(0).map(() => ({
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
        })),
      ],
    });
    expect((await prisma.consumable.findMany()).length).toBe(10);
    await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
      memberId: tickets.customerMember.id,
    });
    expect((await prisma.consumable.findMany()).length).toBe(10);
    const reservations = await prisma.consumableReservation.findMany();
    expect(reservations.length).toBe(1);
    expect(reservations[0]?.memberId).toBe(tickets.customerMember.id);
  });

  it("should place new reservation last after initial lottery", async () => {
    await prisma.consumable.createMany({
      data: [
        ...new Array(5).fill(0).map(() => ({
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
          purchasedAt: new Date(),
        })),
        ...new Array(5).fill(0).map(() => ({
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
        })),
      ],
    });
    await prisma.consumableReservation.create({
      data: {
        shoppableId: tickets.activeTicket.shoppable.id,
        memberId: tickets.adminMember.id,
        order: 0,
      },
    });
    expect((await prisma.consumable.findMany()).length).toBe(10);
    await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
      memberId: tickets.customerMember.id,
    });
    expect((await prisma.consumable.findMany()).length).toBe(10);
    const reservations = await prisma.consumableReservation.findMany();
    expect(reservations.length).toBe(2);
    expect(reservations[0]?.memberId).toBe(tickets.adminMember.id);
    expect(reservations[0]?.order).toBe(0);
    expect(reservations[1]?.memberId).toBe(tickets.customerMember.id);
    expect(reservations[1]?.order).toBe(1);
  });

  it("should not add sold out ticket", async () => {
    await prisma.consumable.createMany({
      data: new Array(10).fill(0).map(() => ({
        shoppableId: tickets.activeTicket.shoppable.id,
        memberId: tickets.adminMember.id, // duplicates, but that's fine
        purchasedAt: new Date(),
      })),
    });
    expect((await prisma.consumable.findMany()).length).toBe(10);
    try {
      await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
        memberId: tickets.customerMember.id,
      });
      expect.fail();
    } catch (error) {
      expect(error).toBeDefined();
    }
    expect((await prisma.consumable.findMany()).length).toBe(10);
    expect((await prisma.consumableReservation.findMany()).length).toBe(0);
  });

  it("should expire un-purchased consumables", async () => {
    await prisma.consumable.createMany({
      data: [
        ...new Array(9).fill(0).map(() => ({
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
        })),
        {
          shoppableId: tickets.activeTicket.shoppable.id,
          memberId: tickets.adminMember.id, // duplicates, but that's fine
          expiresAt: new Date(Date.now() - 1000),
        },
      ],
    });
    await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
      memberId: tickets.customerMember.id,
    });
    const consumables = await prisma.consumable.findMany();
    expect(consumables.length).toBe(10);
    expect(
      consumables.filter((c) => c.memberId === tickets.adminMember.id).length,
    ).toBe(9);
    expect(
      consumables.filter((c) => c.memberId === tickets.customerMember.id)
        .length,
    ).toBe(1);
    expect((await prisma.consumableReservation.findMany()).length).toBe(0);
  });

  describe("anonymous user", () => {
    let prismaWithAccess: PrismaClient;
    beforeAll(async () => {
      prismaWithAccess = enhance(prisma, {
        user: {
          studentId: undefined,
          memberId: undefined,
          policies: await getAccessPolicies(prisma),
          externalCode: "external-code",
        },
      });
    });
    it("should add a valid ticket request", async () => {
      await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
        externalCode: "external-code",
      });
      const consumables = await prisma.consumable.findMany();
      expect(consumables.length).toBe(1);
      expect(consumables[0]).toBeDefined();
      expect(consumables[0]!.memberId).toBeNull();
      expect(consumables[0]!.shoppableId).toBe(
        tickets.activeTicket.shoppable.id,
      );
      expect(consumables[0]!.purchasedAt).toBeNull();
      expect(consumables[0]!.externalCustomerCode).toBe("external-code");
      expect(consumables[0]!.externalCustomerEmail).toBeNull();
      expect(consumables[0]!.consumedAt).toBeNull();
    });
    it("should not add a ticket twice to cart", async () => {
      await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
        externalCode: "external-code",
      });
      try {
        await addTicketToCart(prismaWithAccess, tickets.activeTicket.id, {
          externalCode: "external-code",
        });
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      expect((await prisma.consumable.findMany()).length).toBe(1);
      expect((await prisma.consumableReservation.findMany()).length).toBe(0);
    });

    it("should reserve a ticket instead initially", async () => {
      await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
        externalCode: "external-code",
      });
      const consumables = await prisma.consumable.findMany();
      expect(consumables.length).toBe(0);
      const reservations = await prisma.consumableReservation.findMany();
      expect(reservations.length).toBe(1);
      expect(reservations[0]).toBeDefined();
      expect(reservations[0]?.memberId).toBeNull();
      expect(reservations[0]?.externalCustomerCode).toBe("external-code");
      expect(reservations[0]?.shoppableId).toBe(
        tickets.activeEarlyTicket.shoppable.id,
      );
      expect(reservations[0]?.order).toBeNull();
    });
    it("should not reserve twice", async () => {
      await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
        externalCode: "external-code",
      });
      try {
        await addTicketToCart(prismaWithAccess, tickets.activeEarlyTicket.id, {
          externalCode: "external-code",
        });
        expect.fail();
      } catch (error) {
        expect(error).toBeDefined();
      }
      expect((await prisma.consumableReservation.findMany()).length).toBe(1);
    });
  });
});
