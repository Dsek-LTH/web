import type { PrismaClient } from "@prisma/client";
import { removeExpiredConsumables } from "./addToCart/reservations";
import { dbIdentification, type ShopIdentification } from "./types";

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
      shoppable: {
        include: {
          _count: {
            select: {
              consumables: {
                where: {
                  purchasedAt: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
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

export const getCart = async (prisma: PrismaClient, id: ShopIdentification) => {
  const now = new Date();
  await removeExpiredConsumables(prisma, now);
  const inCart = await prisma.consumable.findMany({
    where: {
      ...dbIdentification(id),
      purchasedAt: null,
    },
    include: {
      questionResponses: true,
      shoppable: {
        include: {
          ticket: true,
          _count: {
            select: {
              consumables: {
                where: {
                  purchasedAt: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const reservations = await prisma.consumableReservation.findMany({
    where: {
      ...dbIdentification(id),
    },
  });
  return {
    inCart,
    reservations,
  };
};
