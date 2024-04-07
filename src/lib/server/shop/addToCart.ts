import { PrismaClient, type Shoppable, type Ticket } from "@prisma/client";
import { ensureState } from "./reservations";
import {
  GRACE_PERIOD_WINDOW,
  TIME_TO_BUY,
  dbIdentification,
  type ShopIdentification,
  type TransactionClient,
} from "./types";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";

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
    throw new Error("Du har redan den här biljetten (i varukorgen)");
  else if (currentlyInCart >= ticket.maxAmountPerUser)
    throw new Error("Du har redan max antal biljetter (i varukorgen)");
};

const addToQueue = async (
  prisma: TransactionClient,
  id: ReturnType<typeof dbIdentification>,
  ticket: Ticket & { shoppable: Shoppable },
) => {
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
  return `Du är i kö på biljetten och är på plats ${
    currentPeopleInQueue.length + 1
  }, du får en notis om det blir din tur att köpa.`;
};

const addReservationInReserveWindow = async (
  prisma: TransactionClient,
  id: ReturnType<typeof dbIdentification>,
  shoppableId: string,
) => {
  const existingReservation = await prisma.consumableReservation.findFirst({
    where: {
      ...id,
    },
  });
  if (existingReservation)
    throw new Error(
      "Biljetten är redan reserverad, du får en notis när lottning är avklarad.",
    );
  await prisma.consumableReservation.create({
    data: {
      ...id,
      shoppableId: shoppableId,
      order: null,
    },
  });
  return "Biljetten är reserverad, du får en notis när lottning är avklarad.";
};

export const addTicketToCart = async (
  prisma: PrismaClient,
  ticketId: string,
  identification: ShopIdentification,
) => {
  const now = new Date(); // ensures checks between the two transactions
  await authorizedPrismaClient.$transaction(async (prisma) => {
    await ensureState(prisma, now, ticketId);
  });
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
    if (!ticket) throw new Error("Kunde inte hitta biljett");

    if (ticket.shoppable.availableTo && ticket.shoppable.availableTo < now)
      throw new Error("Biljettförsäljning har stängt");
    if (ticket.shoppable.availableFrom > now)
      throw new Error("Biljettförsäljning har inte börjat");
    if (ticket.shoppable._count.consumables >= ticket.stock)
      throw new Error("Biljetten är slutsåld");

    const idPart = dbIdentification(identification);

    await checkUserMaxAmount(prisma, idPart, ticket);

    if (
      now.valueOf() - ticket.shoppable.availableFrom.valueOf() <=
      GRACE_PERIOD_WINDOW
    ) {
      return await addReservationInReserveWindow(
        prisma,
        idPart,
        ticket.shoppable.id,
      );
    }

    if (ticket.shoppable.consumables.length >= ticket.stock) {
      return addToQueue(prisma, idPart, ticket);
    }

    await prisma.consumable.create({
      data: {
        ...idPart,
        shoppableId: ticket.shoppable.id,
        expiresAt: new Date(now.valueOf() + TIME_TO_BUY),
      },
    });
    return "Biljett tillagd i varukorgen!";
  });
};

export default addTicketToCart;
