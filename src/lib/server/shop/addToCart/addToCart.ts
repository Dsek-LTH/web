import { PrismaClient, type Shoppable, type Ticket } from "@prisma/client";
import * as m from "$paraglide/messages";
import {
  ensureState,
  performLotteryIfNecessary,
  sendQueuedNotifications,
} from "./reservations";
import {
  GRACE_PERIOD_WINDOW,
  TIME_TO_BUY,
  dbIdentification,
  type ShopIdentification,
  type TransactionClient,
} from "../types";
import authorizedPrismaClient from "../authorizedPrisma";
import type { SendNotificationProps } from "$lib/utils/notifications";

export enum AddToCartStatus {
  AddedToCart = "AddedToCart",
  Reserved = "Reserved",
  PutInQueue = "PutInQueue",
  AddedToInventory = "AddedToInventory",
}

export type AddToCartResult =
  | {
      status: Exclude<AddToCartStatus, AddToCartStatus.PutInQueue>;
    }
  | {
      status: AddToCartStatus.PutInQueue;
      queuePosition: number;
    };
export const addTicketToCart = async (
  prisma: PrismaClient,
  ticketId: string,
  identification: ShopIdentification,
): Promise<AddToCartResult> => {
  const now = new Date(); // ensures checks between the two transactions
  const queuedNotifications: SendNotificationProps[] = [];
  await authorizedPrismaClient.$transaction(async (prisma) => {
    const result = await ensureState(prisma, now, ticketId);
    queuedNotifications.push(...result.queuedNotifications);
  });
  sendQueuedNotifications(queuedNotifications);
  return await prisma.$transaction(async (prisma) => {
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
    if (!ticket) throw new Error(m.tickets_errors_ticketNotFound());

    if (ticket.shoppable.availableTo && ticket.shoppable.availableTo < now)
      throw new Error(m.tickets_addToCart_errors_salePeriodEnded());
    if (ticket.shoppable.availableFrom > now)
      throw new Error(m.tickets_addToCart_errors_salePeriodNotStarted());
    if (ticket.shoppable._count.consumables >= ticket.stock)
      // purchased items
      throw new Error(m.tickets_addToCart_errors_ticketSoldOut());

    const idPart = dbIdentification(identification);

    await checkUserMaxAmount(prisma, idPart, ticket);

    if (
      now.valueOf() - ticket.shoppable.availableFrom.valueOf() <
      GRACE_PERIOD_WINDOW
    ) {
      return await addReservationInReserveWindow(
        prisma,
        idPart,
        ticket.shoppable.id,
        ticket.shoppable.availableFrom.valueOf() +
          GRACE_PERIOD_WINDOW -
          now.valueOf(),
      );
    }

    if (ticket.shoppable.consumables.length >= ticket.stock) {
      return addToQueue(prisma, idPart, ticket);
    }

    if (ticket.shoppable.price === 0) {
      await prisma.consumable.create({
        data: {
          ...idPart,
          shoppableId: ticket.shoppable.id,
          purchasedAt: now,
          priceAtPurchase: 0,
        },
      });
      return { status: AddToCartStatus.AddedToInventory };
    }

    await prisma.consumable.create({
      data: {
        ...idPart,
        shoppableId: ticket.shoppable.id,
        expiresAt: new Date(now.valueOf() + TIME_TO_BUY),
      },
    });
    return { status: AddToCartStatus.AddedToCart };
  });
};

export default addTicketToCart;

const checkUserMaxAmount = async (
  prisma: TransactionClient,
  id: ReturnType<typeof dbIdentification>,
  ticket: Ticket & { shoppable: Shoppable },
) => {
  const currentlyInCart = await prisma.consumable.count({
    where: {
      ...id,
      shoppableId: ticket.shoppable.id,
    },
  });
  if (ticket.maxAmountPerUser == 1 && currentlyInCart > 0)
    throw new Error(m.tickets_addToCart_errors_alreadyOwned());
  else if (currentlyInCart >= ticket.maxAmountPerUser)
    throw new Error(m.tickets_addToCart_errors_alreadyOwnsMax());

  const currentlyReserved = await prisma.consumableReservation.count({
    where: {
      ...id,
      shoppableId: ticket.shoppable.id,
    },
  });
  if (currentlyReserved > 0)
    throw new Error(m.tickets_addToCart_errors_alreadyReserved());
};

const addToQueue = async (
  prisma: TransactionClient,
  id: ReturnType<typeof dbIdentification>,
  ticket: Ticket & { shoppable: Shoppable },
): Promise<AddToCartResult> => {
  const currentPeopleInQueue = await prisma.consumableReservation.findMany({
    where: {
      shoppableId: ticket.shoppable.id,
    },
    orderBy: {
      order: "desc",
    },
  });
  const lastInQueueOrder = currentPeopleInQueue[0]?.order ?? -1;
  await prisma.consumableReservation.create({
    data: {
      ...id,
      shoppableId: ticket.shoppable.id,
      order: lastInQueueOrder + 1,
    },
  });
  return {
    status: AddToCartStatus.PutInQueue,
    queuePosition: lastInQueueOrder + 2,
  };
};

const afterGracePeriod = async (shoppableId: string) => {
  try {
    const queuedNotifications = await authorizedPrismaClient.$transaction(
      async (prisma) => {
        return await performLotteryIfNecessary(prisma, new Date(), shoppableId);
      },
    );
    sendQueuedNotifications(queuedNotifications);
  } catch (err) {
    console.error("problem performing reservation lottery:", err);
  }
};

const gracePeriodTimeouts: Record<string, NodeJS.Timeout> = {};
const addReservationInReserveWindow = async (
  prisma: TransactionClient,
  id: ReturnType<typeof dbIdentification>,
  shoppableId: string,
  timeUntilGracePeriod: number,
): Promise<AddToCartResult> => {
  const existingReservation = await prisma.consumableReservation.findFirst({
    where: {
      ...id,
      shoppableId,
    },
  });
  if (existingReservation)
    throw new Error(m.tickets_addToCart_errors_alreadyReserved());
  await prisma.consumableReservation.create({
    data: {
      ...id,
      shoppableId: shoppableId,
      order: null,
    },
  });
  if (gracePeriodTimeouts[shoppableId] === undefined) {
    gracePeriodTimeouts[shoppableId] = setTimeout(() => {
      afterGracePeriod(shoppableId);
    }, timeUntilGracePeriod);
  }
  return { status: AddToCartStatus.Reserved };
};
