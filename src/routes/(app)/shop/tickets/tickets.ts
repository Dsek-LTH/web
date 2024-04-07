import type { PrismaClient } from "@prisma/client";

const RESERVATION_WINDOW = 60 * 1000; // 1 minute
const TIME_TO_BUY = 5 * 60 * 1000; // 5 minutes

export const getTickets = (prisma: PrismaClient) => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  return prisma.ticket.findMany({
    where: {
      shoppable: {
        AND: [
          {
            OR: [
              {
                removedAt: null,
              },
              {
                removedAt: {
                  lt: new Date(),
                },
              },
            ],
          },
          {
            OR: [
              {
                availableTo: null,
              },
              {
                availableTo: {
                  gt: tenDaysAgo, // show items which were available in the last 10 days
                },
              },
            ],
          },
        ],
      },
    },
    include: {
      shoppable: true,
      event: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: {
      shoppable: {
        availableFrom: "asc",
      },
    },
  });
};

type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];
export const removeExpiredConsumables = async (
  prisma: TransactionClient,
  now: Date,
) => {
  await prisma.consumable.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
      purchasedAt: null,
    },
  });
  // TODO: Send notification
};

export const addTicketToCart = async (
  prisma: PrismaClient,
  ticketId: string,
  {
    memberId,
    externalCode,
  }:
    | {
        memberId: string;
        externalCode?: undefined;
      }
    | {
        memberId?: undefined;
        externalCode: string;
      },
) => {
  return await prisma.$transaction(async (prisma) => {
    const now = new Date();
    await removeExpiredConsumables(prisma, now);

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
        shoppable: {
          // not removed
          OR: [
            {
              removedAt: null,
            },
            {
              removedAt: {
                gt: new Date(),
              },
            },
          ],
        },
      },
      include: {
        shoppable: {
          include: {
            consumables: true,
            _count: {
              select: {
                consumables: {
                  where: {
                    purchasedAt: {
                      not: null,
                    },
                  },
                },
                reservations: true,
              },
            },
          },
        },
      },
    });
    if (!ticket) throw new Error("Kunde inte hitta biljett");

    if (ticket.shoppable.availableTo && ticket.shoppable.availableTo < now)
      throw new Error("Biljettförsäljning har stängt");
    if (ticket.shoppable.availableFrom > now)
      throw new Error("Biljettförsäljning har inte börjat");
    if (ticket.shoppable._count.consumables >= ticket.stock)
      throw new Error("Biljetten är slutsåld");

    const idPart = memberId
      ? { memberId }
      : { externalCustomerCode: externalCode };

    const currentlyInCart = await prisma.consumable.count({
      where: {
        ...idPart,
        shoppableId: ticket.shoppable.id,
      },
    });
    if (ticket.maxAmountPerUser == 1 && currentlyInCart > 0)
      throw new Error("Du har redan den här biljetten (i varukorgen)");
    else if (currentlyInCart >= ticket.maxAmountPerUser)
      throw new Error("Du har redan max antal biljetter (i varukorgen)");

    if (
      now.valueOf() - ticket.shoppable.availableFrom.valueOf() <=
      RESERVATION_WINDOW
    ) {
      const existingReservation = await prisma.consumableReservation.findFirst({
        where: {
          ...idPart,
        },
      });
      if (existingReservation)
        throw new Error(
          "Biljetten är redan reserverad, du får en notis när lottning är avklarad.",
        );
      await prisma.consumableReservation.create({
        data: {
          ...idPart,
          shoppableId: ticket.shoppable.id,
          order: null,
        },
      });
      return "Biljetten är reserverad, du får en notis när lottning är avklarad.";
    }
    const currentPeopleInQueue = await prisma.consumableReservation.findMany({
      where: {
        shoppableId: ticket.shoppable.id,
      },
      orderBy: {
        order: "desc",
      },
    });
    if (
      currentPeopleInQueue.length === 0 &&
      ticket.shoppable.consumables.length < ticket.stock
    ) {
      await prisma.consumable.create({
        data: {
          ...idPart,
          shoppableId: ticket.shoppable.id,
          expiresAt: new Date(now.valueOf() + TIME_TO_BUY), // 15 minutes
        },
      });
      return "Biljett tillagd i varukorgen!";
    }
    const lastInQueueOrder = currentPeopleInQueue[0]?.order ?? -1;
    await prisma.consumableReservation.create({
      data: {
        ...idPart,
        shoppableId: ticket.shoppable.id,
        order: lastInQueueOrder + 1,
      },
    });
    return `Du är i kö på biljetten och är på plats ${
      currentPeopleInQueue.length + 1
    }, du får en notis om det blir din tur att köpa.`;
  });
};
