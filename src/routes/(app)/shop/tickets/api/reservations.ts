import type { ConsumableReservation } from "@prisma/client";
import { TIME_TO_BUY, type TransactionClient } from "./types";

export const removeExpiredConsumables = (
  prisma: TransactionClient,
  now: Date,
) =>
  prisma.consumable.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
      purchasedAt: null,
    },
  });

export const moveReservationsToCart = async (
  prisma: TransactionClient,
  shoppableId: string,
  reservationsToMove: ConsumableReservation[],
) => {
  await prisma.consumable.createMany({
    data: reservationsToMove.map((r) => ({
      ...r,
      order: undefined,
      expiresAt: new Date(Date.now() + TIME_TO_BUY),
    })),
  });
  await prisma.consumableReservation.deleteMany({
    where: {
      id: {
        in: reservationsToMove.map((r) => r.id),
      },
    },
  });
  await prisma.consumableReservation.updateMany({
    where: {
      shoppableId,
    },
    data: {
      order: {
        decrement: reservationsToMove.length,
      },
    },
  });
};

/**
 * Updates queue, moves people from queue to cart if space is available. Also updates order. Assumes any expired consumables are pruned.
 */
export const updateQueue = async (
  prisma: TransactionClient,
  shoppableId: string,
) => {
  const reservations = await prisma.consumableReservation.findMany({
    where: {
      shoppableId,
    },
    orderBy: {
      order: "asc",
    },
  });
  const inCartOrPurchased = await prisma.consumable.count({
    where: {
      shoppableId,
    },
  });
  const { stock } = (await prisma.ticket.findUnique({
    where: {
      id: shoppableId,
    },
    select: {
      stock: true,
    },
  })) ?? { stock: 0 };
  if (reservations.length === 0) {
    return { moved: 0, spaceLeft: stock - inCartOrPurchased };
  }
  if (inCartOrPurchased >= stock) {
    return { moved: 0, spaceLeft: 0 }; // no space left, don't move anyhing
  }
  // there is space left for new items space left
  const toMove = Math.min(stock - inCartOrPurchased, reservations.length);
  await moveReservationsToCart(
    prisma,
    shoppableId,
    reservations.slice(0, toMove),
  );
  return { moved: toMove, spaceLeft: stock - inCartOrPurchased - toMove };
};
