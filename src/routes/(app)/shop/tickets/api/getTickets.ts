import type { PrismaClient } from "@prisma/client";
import { removeExpiredConsumables } from "./reservations";
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

export const getCart = async (prisma: PrismaClient, id: ShopIdentification) => {
  return await prisma.$transaction(async (prisma) => {
    const now = new Date();
    await removeExpiredConsumables(prisma, now);
    await prisma.consumable.findMany({
      where: {
        ...dbIdentification(id),
        purchasedAt: null,
      },
    });
  });
};
