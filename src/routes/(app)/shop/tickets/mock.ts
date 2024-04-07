import { ShoppableType, type PrismaClient } from "@prisma/client";

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
      name: "tag1",
    },
    {
      name: "tag2",
    },
  ],
};

export const MOCK_ACTIVE_TICKET = {
  stock: 10,
  shoppable: {
    type: ShoppableType.TICKET,
    title: "Active ticket",
    description: "Active ticketdescription",
    price: 10000,
    availableFrom: new Date(Date.now() - 1000 * 60 * 60 * 24),
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

export const addMockTickets = async (prisma: PrismaClient) => {
  return await prisma.$transaction(async (prisma) => {
    const adminMember = await prisma.member.create({
      data: {
        studentId: "admin-member",
      },
    });
    const customerMember = await prisma.member.create({
      data: {
        studentId: "tickets-test",
      },
    });
    const event1 = await prisma.event.create({
      data: {
        ...MOCK_EVENT_1,
        authorId: adminMember.id,
        tags: {
          create: MOCK_EVENT_1.tags,
        },
      },
      include: {
        tags: true,
      },
    });
    const activeTicket = await prisma.ticket.create({
      data: {
        ...MOCK_ACTIVE_TICKET,
        shoppable: {
          create: {
            ...MOCK_ACTIVE_TICKET.shoppable,
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
    const activeEarlyTicket = await prisma.ticket.create({
      data: {
        ...MOCK_ACTIVE_EARLY_TICKET,
        shoppable: {
          create: {
            ...MOCK_ACTIVE_EARLY_TICKET.shoppable,
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
    const pastTicket = await prisma.ticket.create({
      data: {
        ...MOCK_PAST_TICKET,
        shoppable: {
          create: {
            ...MOCK_PAST_TICKET.shoppable,
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
    const upcomingTicket = await prisma.ticket.create({
      data: {
        ...MOCK_UPCOMING_TICKET,
        shoppable: {
          create: {
            ...MOCK_UPCOMING_TICKET.shoppable,
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
    return {
      adminMember,
      customerMember,
      event1,
      activeTicket,
      activeEarlyTicket,
      pastTicket,
      upcomingTicket,
    };
  });
};

export const removeMockTickets = async (prisma: PrismaClient) => {
  await prisma.$transaction(async (prisma) => {
    await prisma.shoppable.deleteMany({
      where: {
        author: {
          studentId: {
            in: ["admin-member", "tickets-test"],
          },
        },
      },
    });
    await prisma.event.deleteMany({
      where: {
        author: {
          studentId: {
            in: ["admin-member", "tickets-test"],
          },
        },
      },
    });
    await prisma.member.deleteMany({
      where: {
        studentId: {
          in: ["admin-member", "tickets-test"],
        },
      },
    });
  });
};
