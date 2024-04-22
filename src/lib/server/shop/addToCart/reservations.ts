import type { Consumable, ConsumableReservation, Ticket } from "@prisma/client";
import {
  GRACE_PERIOD_WINDOW,
  TIME_TO_BUY,
  type TransactionClient,
} from "../types";
import {
  removePaymentIntent,
  ensurePaymentIntentState,
} from "$lib/server/shop/payments/stripeMethods";

/**
 * Ensures the reservation state of the given shoppable. It will ensure the state at the timepoint "now".
 * It removes all consumables which have expired at "now". It also performs the reservation lottery if "now" is after the grace period window.
 * @returns an array of ticket ids that were modified, if any
 */
export const ensureState = async (
  prisma: TransactionClient,
  now: Date,
  shoppableId: string,
): Promise<string[] | undefined> => {
  const modifiedTickets = await removeExpiredConsumables(prisma, now);
  await performLotteryIfNecessary(prisma, now, shoppableId);
  return modifiedTickets;
};

/**
 * Removes all expired consumables. Also updates any necessary queues for tickets where spots just opened up.
 * @returns an array of ticket ids that were modified
 */
export const removeExpiredConsumables = async (
  prisma: TransactionClient,
  now: Date,
) => {
  const expiredWithIntent = await prisma.consumable.findMany({
    where: {
      expiresAt: {
        not: null,
        lte: now,
      },
      purchasedAt: null,
      stripeIntentId: {
        not: null,
      },
    },
  });
  if (expiredWithIntent.length > 0) {
    const intentIds = new Set(expiredWithIntent.map((e) => e.stripeIntentId));
    for (const intentId of intentIds) {
      try {
        const [, canTryAgain] = await ensurePaymentIntentState(intentId!);
        if (canTryAgain) {
          // payment not completed
          await removePaymentIntent(intentId!);
        } else {
          // success, canceled, or unknown. Do nothing
        }
      } catch {
        // do not expire it. Either processing, or something else failed
      }
    }
  }
  const removed = await prisma.consumable.deleteMany({
    where: {
      expiresAt: {
        not: null,
        lte: now,
      },
      purchasedAt: null,
      stripeIntentId: null,
    },
  });
  if (removed.count > 0) {
    const modifiedTickes = await updateAllNecessaryQueues(prisma);
    return modifiedTickes;
  }
  return undefined;
};

/**
 * Loops through all tickets with an active queue (reservations). If there is space left, moves people from the queue to the cart.
 */
export const updateAllNecessaryQueues = async (prisma: TransactionClient) => {
  // Step 1: Find all tickets with at least one reservation
  const ticketsWithReservations = await prisma.ticket.findMany({
    where: {
      shoppable: {
        reservations: {
          some: {}, // 'some' ensures that there is at least one reservation
          every: {
            order: {
              not: null, // if there is a null order, lotter should have been performed or should be performed
            },
          },
        },
        availableFrom: {
          lte: new Date(Date.now() - GRACE_PERIOD_WINDOW),
        },
      },
    },
    include: {
      shoppable: {
        include: {
          reservations: true,
          consumables: true,
        },
      },
    },
  });

  await Promise.all(
    ticketsWithReservations.map((ticket) =>
      updateQueue(
        prisma,
        ticket,
        ticket.shoppable.reservations,
        ticket.shoppable.consumables,
      ),
    ),
  );
  return ticketsWithReservations.map((t) => t.id);
};

/**
 * Updates queue, moves people from queue to cart if space is available. Also updates order. Assumes any expired consumables are pruned.
 */
const updateQueue = async (
  prisma: TransactionClient,
  ticket: Ticket,
  reservations: ConsumableReservation[],
  consumables: Consumable[],
) => {
  const purchasedConsumablesCount = consumables.filter(
    (con) => con.purchasedAt != null,
  ).length;

  // Remove all reservations if the ticket is sold out
  if (purchasedConsumablesCount >= ticket.stock) {
    await prisma.consumableReservation.deleteMany({
      where: {
        shoppableId: ticket.id,
      },
    });
  } else {
    // Update the queue for tickets that are not sold out
    await updateQueueGivenStock(
      prisma,
      ticket.id,
      reservations,
      consumables.length,
      ticket.stock,
    );
  }
};

const updateQueueGivenStock = async (
  prisma: TransactionClient,
  shoppableId: string,
  reservations: ConsumableReservation[],
  inCartOrPurchased: number,
  stock: number,
) => {
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

const moveReservationsToCart = async (
  prisma: TransactionClient,
  shoppableId: string,
  reservationsToMove: ConsumableReservation[],
  updateOrder = true,
) => {
  await prisma.consumable.createMany({
    data: reservationsToMove.map((r) => ({
      ...r,
      shoppableId,
      order: undefined,
      expiresAt: new Date(Date.now() + TIME_TO_BUY),
    })),
  });
  await prisma.consumableReservation.deleteMany({
    where: {
      shoppableId,
      id: {
        in: reservationsToMove.map((r) => r.id),
      },
    },
  });
  if (updateOrder)
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
 * Checks if enough time has passed such that the grace period window is over, and then performs the lottery if necessary.
 */
export const performLotteryIfNecessary = async (
  prisma: TransactionClient,
  now: Date,
  shoppableId: string,
) => {
  const ticketAfterGracePeriodWithReservations = await prisma.ticket.findUnique(
    {
      where: {
        id: shoppableId,
        shoppable: {
          reservations: {
            some: {
              order: null,
            },
          },
          availableFrom: {
            lte: new Date(now.valueOf() - GRACE_PERIOD_WINDOW),
          },
        },
      },
    },
  );
  if (ticketAfterGracePeriodWithReservations !== null) {
    await performReservationLottery(prisma, shoppableId);
  }
};
/**
 * Once the initial grace period is over, call this method. It goes through all reservations and performs the following logic:
 * - If the number of reservations is less than or equal to the stock, move all reservations to cart
 * - Otherwise, randomize the order of the reservations. The first 0->stock reservations are moved to cart, the rest are kept with the field order given a value depending on their queue position.
 */
export const performReservationLottery = async (
  prisma: TransactionClient,
  shoppableId: string,
) => {
  const reservations = await prisma.consumableReservation.findMany({
    where: {
      shoppableId,
      order: null,
    },
  });
  if (reservations.length === 0) return;
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: shoppableId,
    },
  });
  if (ticket == null) {
    throw new Error("Ticket not found");
  }
  const stock = ticket?.stock ?? 0;
  if (reservations.length <= stock) {
    // all can be moved to cart
    await moveReservationsToCart(prisma, shoppableId, reservations, false);
    return;
  }
  const shuffledReservations = shuffle(reservations);
  const toMove = shuffledReservations.slice(0, stock);
  const toKeep = shuffledReservations.slice(stock);
  await moveReservationsToCart(prisma, shoppableId, toMove, false);
  // set order for the rest, depending on their place in the queue. So first place gets order = 0, second place gets order = 1, etc.
  await Promise.all(
    toKeep.map((r, i) =>
      prisma.consumableReservation.update({
        where: {
          id: r.id,
        },
        data: {
          order: i,
        },
      }),
    ),
  );
};

const shuffle = <T>(array: T[]): T[] => {
  const copy = [...array];
  let currentIndex = copy.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    --currentIndex;

    // And swap it with the current element.
    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex]!,
      copy[currentIndex]!,
    ];
  }
  return copy;
};
