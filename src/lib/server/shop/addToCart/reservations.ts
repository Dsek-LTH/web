import {
  ensurePaymentIntentState,
  removePaymentIntent,
} from "$lib/server/shop/payments/stripeMethods";
import sendNotification, {
  type SendNotificationProps,
} from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import * as m from "$paraglide/messages";
import {
  GRACE_PERIOD_WINDOW,
  TIME_TO_BUY,
  type TransactionClient,
} from "../types";
import { type ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";

/*
NOTE ON NOTIFICATION QUEUE SYSTEM:
So a lof of these method below perform actions which should send notifications afterwards. Like someone's item expiring, winning the lottery etc.
All of these methods are built to be run in a transaction as well, but this creates a problem. Because the transaction can fail later and be reverted, but at that point a notification would have already been sent.
To fix this, notifications are instead "queued" and returned as a list. A method which calls one of this methods MUST keep track of the returned notification and either send them, or pass onto the caller.
For the method which starts the original transaction, make sure to send the notifications after the transaction suceeds, or wrap it in the `withHandledNotificationQueue` decorator function.
*/

/**
 * Ensures the reservation state of the given shoppable. It will ensure the state at the timepoint "now".
 * It removes all consumables which have expired at "now". It also performs the reservation lottery if "now" is after the grace period window.
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this. This can be turned off with one of the properties
 * @returns an array of ticket ids that were modified, if any, as well as the queued notifications
 */
export const ensureState = async (
  prisma: TransactionClient,
  now: Date,
  shoppableId: string,
): Promise<{
  modifiedTickets: string[] | undefined;
  queuedNotifications: SendNotificationProps[];
}> => {
  const { modifiedTickets, queuedNotifications } =
    await removeExpiredConsumables(prisma, now);
  const queuedNotifications2 = await performLotteryIfNecessary(
    prisma,
    now,
    shoppableId,
  );
  return {
    modifiedTickets,
    queuedNotifications: queuedNotifications.concat(queuedNotifications2),
  };
};

/**
 * Removes all expired consumables. Also updates any necessary queues for tickets where spots just opened up.
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this. This can be turned off with one of the properties
 * @returns an array of ticket ids that were modified, as well as the queued notifications
 */
export const removeExpiredConsumables = async (
  prisma: TransactionClient,
  now: Date,
): Promise<{
  modifiedTickets: string[] | undefined;
  queuedNotifications: SendNotificationProps[];
}> => {
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
  const toBeRemoved = await prisma.consumable.findMany({
    where: {
      expiresAt: {
        not: null,
        lte: now,
      },
      purchasedAt: null,
      stripeIntentId: null,
    },
  });
  let queuedNotifications: SendNotificationProps[] = [];
  if (toBeRemoved.length > 0) {
    // Notify users of expired consumables
    queuedNotifications.push({
      title: "Produkt i kundvagnen har löpt ut",
      message:
        `Den reserverade tiden du hade för att skaffa produkten har löpt ut, om det finns lager kvar kan du försöka skaffa den igen här.`,
      link: "/shop/tickets",
      memberIds: toBeRemoved
        .map((item) => item.memberId)
        .filter(Boolean) as string[],
      type: NotificationType.PURCHASE_CONSUMABLE_EXPIRED,
    });
    await prisma.consumable.deleteMany({
      where: {
        expiresAt: {
          not: null,
          lte: now,
        },
        purchasedAt: null,
        stripeIntentId: null,
      },
    });
  }
  const { modifiedTickets, queuedNotifications: newQueuedNotifications } =
    await updateAllNecessaryQueues(prisma);
  queuedNotifications = queuedNotifications.concat(newQueuedNotifications);
  return {
    modifiedTickets,
    queuedNotifications,
  };
};

let pruneTimeout: ReturnType<typeof setTimeout> | null = null;
// Queues a timeout to call removeExpiredConsumables when next consumable expires
export const queueNextExpiredConsumablesPruning = async () => {
  if (pruneTimeout) return;
  const nextConsumableToExpire = await authorizedPrismaClient.consumable
    .findFirst({
      where: {
        expiresAt: {
          not: null,
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });
  if (nextConsumableToExpire == null || !nextConsumableToExpire.expiresAt) {
    return;
  }
  pruneTimeout = setTimeout(async () => {
    const now = new Date();
    await withHandledNotificationQueue(
      removeExpiredConsumables(authorizedPrismaClient, now).then(
        (r) => r.queuedNotifications,
      ),
    );
    if (pruneTimeout) clearTimeout(pruneTimeout);
    /// queue next time removeExpiredConsumables should be called
    await queueNextExpiredConsumablesPruning();
  }, nextConsumableToExpire.expiresAt.valueOf() - Date.now());
};

/**
 * Loops through all tickets with an active queue (reservations). If there is space left, moves people from the queue to the cart.
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this.
 */
const updateAllNecessaryQueues = async (
  prisma: TransactionClient,
): Promise<{
  modifiedTickets: string[] | undefined;
  queuedNotifications: SendNotificationProps[];
}> => {
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

  const queuedNotifications = (
    await Promise.all(
      ticketsWithReservations.map((ticket) =>
        updateQueue(
          prisma,
          ticket,
          ticket.shoppable.reservations.map((reservation) => ({
            ...reservation,
            shoppable: ticket.shoppable,
          })),
          ticket.shoppable.consumables,
        )
      ),
    )
  ).flatMap((notifications) => notifications);
  return {
    modifiedTickets: ticketsWithReservations.map((t) => t.id),
    queuedNotifications,
  };
};

/**
 * Updates queue, moves people from queue to cart if space is available. Also updates order. Assumes any expired consumables are pruned.
 */
const updateQueue = async (
  prisma: TransactionClient,
  ticket: ExtendedPrismaModel<"Ticket">,
  reservations: Array<
    ExtendedPrismaModel<"ConsumableReservation"> & {
      shoppable: ExtendedPrismaModel<"Shoppable">;
    }
  >,
  consumables: Array<ExtendedPrismaModel<"Consumable">>,
): Promise<SendNotificationProps[]> => {
  const purchasedConsumablesCount = consumables.filter(
    (con) => con.purchasedAt != null,
  ).length;

  // Remove all reservations if the ticket is sold out
  if (purchasedConsumablesCount >= ticket.stock) {
    const soldOutReservations = await prisma.consumableReservation.findMany({
      where: {
        shoppableId: ticket.id,
      },
      include: {
        shoppable: true,
      },
    });
    await prisma.consumableReservation.deleteMany({
      where: {
        shoppableId: ticket.id,
      },
    });
    // queue notification to notify users in queue that the ticket sold out
    return [
      {
        title: "😢 Slutsålt:(",
        message: `${
          soldOutReservations[0]?.shoppable?.title ?? "Biljett"
        } har blivit slutsåld`,
        memberIds: soldOutReservations
          .map((res) => res.memberId)
          .filter(Boolean) as string[],
        type: NotificationType.PURCHASE_SOLD_OUT,
        link: "/shop/cart",
      },
    ];
  } else {
    // Update the queue for tickets that are not sold out
    return (
      await updateQueueGivenStock(
        prisma,
        ticket.id,
        reservations,
        consumables.length,
        ticket.stock,
      )
    ).queuedNotifications;
  }
};

const updateQueueGivenStock = async (
  prisma: TransactionClient,
  shoppableId: string,
  reservations: Array<
    ExtendedPrismaModel<"ConsumableReservation"> & {
      shoppable: ExtendedPrismaModel<"Shoppable">;
    }
  >,
  inCartOrPurchased: number,
  stock: number,
): Promise<{
  moved: number;
  spaceLeft: number;
  queuedNotifications: SendNotificationProps[];
}> => {
  if (reservations.length === 0) {
    return {
      moved: 0,
      spaceLeft: stock - inCartOrPurchased,
      queuedNotifications: [],
    };
  }
  if (inCartOrPurchased >= stock) {
    return { moved: 0, spaceLeft: 0, queuedNotifications: [] }; // no space left, don't move anyhing
  }
  // there is space left for new items space left
  const toMove = Math.min(stock - inCartOrPurchased, reservations.length);
  const queuedNotifications = await moveReservationsToCart(
    prisma,
    shoppableId,
    reservations.slice(0, toMove),
  );
  return {
    moved: toMove,
    spaceLeft: stock - inCartOrPurchased - toMove,
    queuedNotifications,
  };
};

export const moveQueueForwardOneStep = async (
  prisma: TransactionClient,
  shoppableId: string,
  fromOrder: number,
) => {
  return await prisma.consumableReservation.updateMany({
    where: {
      shoppableId,
      order: {
        not: null,
        gt: fromOrder,
      },
    },
    data: {
      order: {
        decrement: 1,
      },
    },
  });
};

/**
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this. This can be turned off with one of the properties
 */
export const moveQueueToCart = async (
  prisma: TransactionClient,
  shoppableId: string,
  amountToMove: number,
  updateOrder?: boolean,
) => {
  const reservationsToMove = await prisma.consumableReservation.findMany({
    where: {
      shoppableId,
      order: {
        not: null,
      },
    },
    orderBy: {
      order: "asc",
    },
    take: amountToMove,
    include: {
      shoppable: true,
    },
  });
  return await moveReservationsToCart(
    prisma,
    shoppableId,
    reservationsToMove,
    updateOrder,
  );
};

/**
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this. This can be turned off with one of the properties
 */
const moveReservationsToCart = async (
  prisma: TransactionClient,
  shoppableId: string,
  reservationsToMove: Array<
    ExtendedPrismaModel<"ConsumableReservation"> & {
      shoppable: ExtendedPrismaModel<"Shoppable">;
    }
  >,
  updateOrder = true,
  shouldQueueNotifications = true,
): Promise<SendNotificationProps[]> => {
  if (reservationsToMove.length === 0) return [];
  await prisma.consumable.createMany({
    data: reservationsToMove.map((r) => ({
      shoppableId,
      memberId: r.memberId,
      externalCustomerCode: r.externalCustomerCode,
      externalCustomerEmail: r.externalCustomerEmail,
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
  if (updateOrder) {
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
  }

  if (shouldQueueNotifications) {
    // Queue notification to tell people that they can now purchase their item
    return [
      {
        title: "🎉 Din tur!",
        message: `Det är nu din tur att få ${
          (reservationsToMove[0]?.shoppable.price ?? 1) > 0 ? "köpa" : "skaffa"
        } ${reservationsToMove[0]?.shoppable?.title ?? "det du köade till"}`,
        memberIds: reservationsToMove
          .map((res) => res.memberId)
          .filter(Boolean) as string[],
        type: NotificationType.PURCHASE_TIME_TO_BUY,
        link: "/shop/cart",
      },
    ];
  }
  return [];
};

/**
 * Checks if enough time has passed such that the grace period window is over, and then performs the lottery if necessary.
 * IMPORTANT! This method returns some notifications it wants the caller to send afterwards, remember to do this.
 */
export const performLotteryIfNecessary = async (
  prisma: TransactionClient,
  now: Date,
  shoppableId: string,
): Promise<SendNotificationProps[]> => {
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
    return await performReservationLottery(prisma, shoppableId);
  }
  return [];
};
/**
 * Once the initial grace period is over, call this method. It goes through all reservations and performs the following logic:
 * - If the number of reservations is less than or equal to the stock, move all reservations to cart
 * - Otherwise, randomize the order of the reservations. The first 0->stock reservations are moved to cart, the rest are kept with the field order given a value depending on their queue position.
 */
const performReservationLottery = async (
  prisma: TransactionClient,
  shoppableId: string,
): Promise<SendNotificationProps[]> => {
  const reservations = await prisma.consumableReservation.findMany({
    where: {
      shoppableId,
      order: null,
    },
    include: {
      shoppable: true,
    },
  });
  if (reservations.length === 0) return [];
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: shoppableId,
    },
  });
  if (ticket == null) {
    throw new Error(m.tickets_errors_ticketNotFound());
  }
  const stock = ticket?.stock ?? 0;
  if (reservations.length <= stock) {
    // all can be moved to cart
    await moveReservationsToCart(prisma, shoppableId, reservations, false);
    // Queue notification that users can purchase their item
    return [
      {
        title: "🎉 Du vann lotteriet!",
        message: `Det är dags att ${
          (reservations[0]?.shoppable.price ?? 1) > 0 ? "köpa" : "skaffa"
        } ${reservations[0]?.shoppable?.title ?? "det du reserverade"}`,
        memberIds: reservations
          .map((res) => res.memberId)
          .filter(Boolean) as string[],
        type: NotificationType.PURCHASE_TIME_TO_BUY,
        link: "/shop/cart",
      },
    ];
  }
  const shuffledReservations = shuffle(reservations);
  const winners = shuffledReservations.slice(0, stock);
  const losers = shuffledReservations.slice(stock);
  await moveReservationsToCart(prisma, shoppableId, winners, false, false);
  // set order for the rest, depending on their place in the queue. So first place gets order = 0, second place gets order = 1, etc.
  await Promise.all(
    losers.map((r, i) =>
      prisma.consumableReservation.update({
        where: {
          id: r.id,
        },
        data: {
          order: i,
        },
      })
    ),
  );
  // Queue notifications to winners of lottery, and to losers, telling them what happened
  const queuedNotifications: SendNotificationProps[] = [
    {
      title: "🎉🍀 Du vann lotteriet!",
      message: `Det är dags att ${
        (reservations[0]?.shoppable.price ?? 1) > 0 ? "köpa" : "skaffa"
      } ${reservations[0]?.shoppable?.title ?? "det du reserverade"}`,
      memberIds: winners.map((res) => res.memberId).filter(Boolean) as string[],
      type: NotificationType.PURCHASE_TIME_TO_BUY,
      link: "/shop/cart",
    },
    {
      title: "😕 Du hamnade tyvärr i kö",
      message: `Många reserverade samma sak som du och du hamnade i kö för ${
        reservations[0]?.shoppable?.title ?? "det du reserverade"
      }. Du kan se din köplats här.`,
      memberIds: losers.map((res) => res.memberId).filter(Boolean) as string[],
      type: NotificationType.PURCHASE_IN_QUEUE,
      link: "/shop/cart",
    },
  ];
  return queuedNotifications;
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

/**
 * Wraps a promise which returns a list of queued notifications, and sends them when it finishes
 */
export const withHandledNotificationQueue = async (
  queuedNotificationPromise: Promise<SendNotificationProps[]>,
) => {
  const queuedNotifications = await queuedNotificationPromise;
  sendQueuedNotifications(queuedNotifications);
};

/**
 * In general should not be awaited, let it run in the background. Usually it's called in endpoints where to goal is not to send a notification, so it doesn't make sense if that endpoint fails due to a notification failure.
 */
export const sendQueuedNotifications = async (
  queuedNotifications: SendNotificationProps[],
) => {
  if (queuedNotifications.length == 0) return;
  const results = await Promise.allSettled(
    queuedNotifications.map(sendNotification),
  );
  if (results.some((result) => result.status === "rejected")) {
    console.error(
      `${
        results.filter((results) => results.status === "rejected")
      } out of ${results.length} notification send-outs failed`,
    );
    throw new Error(`An error was thrown when trying to send notifications.`);
  }
};
