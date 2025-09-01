import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { TransactionClient } from "$lib/server/shop/types";
import { SUBSCRIPTION_SETTINGS_MAP } from "$lib/utils/notifications/types";
import { ShoppableType, type Member } from "@prisma/client";

export const MOCK_EVENT_1 = {
  title: "Event 1",
  description: "Event 1 description",
  organizer: "Organizer 1",
  location: "Location 1",
  shortDescription: "Short description 1",
  startDatetime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  endDatetime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8),
  tags: [
    {
      name: "MOCKED_tag1",
    },
    {
      name: "MOCKED_tag2",
    },
  ],
};

export const MOCK_ACTIVE_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Active ticket",
    description: "Active ticket description",
    price: 10000,
    availableFrom: new Date(Date.now() - 1000 * 60 * 60 * 24),
    availableTo: new Date(Date.now() + 1000 * 60 * 60 * 24),
  },
};
export const MOCK_ACTIVE_TICKET_2 = {
  stock: 2,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Active ticket 2",
    description: "Active ticket description 2",
    price: 8900,
    availableFrom: new Date(Date.now() - 1000 * 60 * 60 * 23),
    availableTo: new Date(Date.now() + 1000 * 60 * 60 * 24),
  },
};
export const MOCK_FREE_ACTIVE_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Free ticket",
    description: "Free ticket description",
    price: 0,
    availableFrom: new Date(Date.now() - 1000 * 60 * 60 * 22),
    availableTo: new Date(Date.now() + 1000 * 60 * 60 * 24),
  },
};

export const MOCK_ACTIVE_EARLY_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Early ticket",
    description: "Early ticket description",
    price: 12400,
    availableFrom: new Date(Date.now()), // just became available
    availableTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
  },
};
export const MOCK_PAST_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Past ticket",
    description: "Past ticket description",
    price: 8900,
    availableFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    availableTo: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
};
export const MOCK_UPCOMING_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Upcoming ticket",
    description: "Upcoming ticket description",
    price: 7400,
    availableFrom: new Date(Date.now() + 1000 * 60 * 60 * 24),
    availableTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
  },
};

export type MockTickets = Awaited<ReturnType<typeof addMockTickets>>;
export const addMockUser = async (
  prisma: TransactionClient | ExtendedPrisma,
  suitePrefix: string,
) => {
  return await prisma.member.create({
    data: {
      studentId: "MOCKED_" + suitePrefix + crypto.randomUUID(),
    },
  });
};
export const addMockUsers = async (
  prisma: ExtendedPrisma,
  suitePrefix: string,
) => {
  return await prisma.$transaction(async (prisma) => {
    const adminMember = await addMockUser(prisma, suitePrefix);
    const customerMember = await addMockUser(prisma, suitePrefix);
    return {
      adminMember,
      customerMember,
    };
  });
};
export const addMockTickets = async (
  prisma: ExtendedPrisma,
  adminMember: Member,
) => {
  return await prisma.$transaction(async (prisma) => {
    const event1 = await prisma.event.create({
      data: {
        ...MOCK_EVENT_1,
        title: "MOCKED_" + MOCK_EVENT_1.title,
        authorId: adminMember.id,
        tags: {
          create: MOCK_EVENT_1.tags.map((tag) => ({
            ...tag,
            name: "MOCKED_" + tag.name,
          })),
        },
      },
      include: {
        tags: true,
      },
    });
    const tickets = [];
    for (const ticket of [
      MOCK_ACTIVE_TICKET,
      MOCK_ACTIVE_TICKET_2,
      MOCK_FREE_ACTIVE_TICKET,
      MOCK_ACTIVE_EARLY_TICKET,
      MOCK_PAST_TICKET,
      MOCK_UPCOMING_TICKET,
    ]) {
      const createdTicket = await prisma.ticket.create({
        data: {
          ...ticket,
          shoppable: {
            create: {
              ...ticket.shoppable,
              title: "MOCKED_" + ticket.shoppable.title,
              authorId: adminMember.id,
            },
          },
          event: {
            connect: {
              id: event1.id,
            },
          }, // Add the missing event property
        },
        include: {
          shoppable: true,
          event: {
            include: {
              tags: true,
            },
          },
        },
      });
      tickets.push(createdTicket);
    }
    if (tickets.length != 6) throw new Error("Failed to create tickets");
    return {
      activeTicket: tickets[0]!,
      activeTicket2: tickets[1]!,
      freeActiveTicket: tickets[2]!,
      activeEarlyTicket: tickets[3]!,
      pastTicket: tickets[4]!,
      upcomingTicket: tickets[5]!,
    };
  });
};

export const removeMockTickets = async (
  prisma: ExtendedPrisma,
  ticketIds: string[],
) => {
  await prisma.$transaction(async (tx) => {
    await tx.consumable.deleteMany({
      where: {
        shoppableId: {
          in: ticketIds,
        },
      },
    }); // remove all consumables
    await tx.consumableReservation.deleteMany({
      where: {
        shoppableId: {
          in: ticketIds,
        },
      },
    }); // remove all reservations
    const mockedEvents = await tx.event.findMany({
      where: {
        tickets: {
          some: {
            id: {
              in: ticketIds,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });
    await tx.shoppable.deleteMany({
      where: {
        id: {
          in: ticketIds,
        },
      },
    });
    await tx.event.deleteMany({
      where: {
        id: {
          in: mockedEvents.map((e) => e.id),
        },
      },
    });
  });
};

export const removeMockUsers = async (
  prisma: ExtendedPrisma,
  memberIds: string[],
) => {
  await prisma.$transaction(async (tx) => {
    await tx.event.deleteMany({
      where: {
        authorId: {
          in: memberIds,
        },
      },
    });
    await tx.member.deleteMany({
      where: {
        id: {
          in: memberIds,
        },
      },
    });
  });
};

export const removeAllTestData = async (
  prisma: ExtendedPrisma,
  suitePrefix: string,
) => {
  await prisma.notification.deleteMany({
    where: {
      OR: SUBSCRIPTION_SETTINGS_MAP.PURCHASES.map((type) => ({
        type,
      })),
    },
  });
  await prisma.shoppable.deleteMany({
    where: {
      author: {
        studentId: {
          startsWith: "MOCKED_" + suitePrefix,
        },
      },
    },
  });
  await prisma.event.deleteMany({
    where: {
      author: {
        studentId: {
          startsWith: "MOCKED_" + suitePrefix,
        },
      },
    },
  });
  await prisma.member.deleteMany({
    where: {
      studentId: {
        startsWith: "MOCKED_" + suitePrefix,
      },
    },
  });
  await prisma.tag.deleteMany({
    where: {
      name: {
        startsWith: "MOCKED_",
      },
    },
  });
};
