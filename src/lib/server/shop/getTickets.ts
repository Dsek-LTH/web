import {
  PrismaClient,
  type Event,
  type Prisma,
  type Shoppable,
  type Tag,
  type Ticket,
} from "@prisma/client";
import { removeExpiredConsumables } from "./addToCart/reservations";
import {
  GRACE_PERIOD_WINDOW,
  dbIdentification,
  type DBShopIdentification,
  type ShopIdentification,
} from "./types";
import dayjs from "dayjs";

export type TicketWithMoreInfo = Ticket &
  Shoppable & {
    event: Event & {
      tags: Tag[];
    };
    gracePeriodEndsAt: Date;
    isInUsersCart: boolean;
    userAlreadyHasMax: boolean;
    ticketsLeft: number;
  };

const ticketIncludedFields = (id: DBShopIdentification) => ({
  shoppable: {
    include: {
      // Get the user's consumables and reservations for this ticket
      consumables: {
        where: {
          ...id,
          OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
        },
      },
      reservations: { where: { ...id } },
      _count: {
        select: {
          // Number of bought tickets
          consumables: {
            where: { purchasedAt: { not: null } },
          },
        },
      },
    },
  },
  event: { include: { tags: true } },
});

type TicketInclude = ReturnType<typeof ticketIncludedFields>;
type TicketFromPrisma = Prisma.TicketGetPayload<{ include: TicketInclude }>;

const formatTicket = (ticket: TicketFromPrisma): TicketWithMoreInfo => {
  const base: TicketWithMoreInfo &
    Partial<
      Pick<
        TicketFromPrisma["shoppable"],
        "consumables" | "reservations" | "_count"
      > &
        Pick<TicketFromPrisma, "shoppable">
    > = {
    ...ticket.shoppable,
    ...ticket,
    gracePeriodEndsAt: new Date(
      ticket.shoppable.availableFrom.valueOf() + GRACE_PERIOD_WINDOW,
    ),
    isInUsersCart:
      ticket.shoppable.consumables.filter((c) => !c.purchasedAt).length > 0 ||
      ticket.shoppable.reservations.length > 0,
    userAlreadyHasMax:
      ticket.shoppable.consumables.filter((c) => c.purchasedAt !== null)
        .length >= ticket.maxAmountPerUser,
    ticketsLeft: Math.min(
      ticket.stock - ticket.shoppable._count.consumables,
      10,
    ), // don't show more resolution to the client than > 10 or the exact number left (so people can't see how many other people buy tickets)
  };
  // do not show the following info to the client
  delete base.consumables;
  delete base.reservations;
  delete base.shoppable;
  delete base._count;
  return base;
};

export const getTicket = async (
  prisma: PrismaClient,
  id: string,
  userId: ShopIdentification,
): Promise<TicketWithMoreInfo | null> => {
  const dbId = dbIdentification(userId);
  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
    },
    include: ticketIncludedFields(dbId),
  });
  if (!ticket) {
    return null;
  }
  return formatTicket(ticket);
};

/**
 * Retrieves tickets from the database based on the provided shop identification.
 * @param prisma - The Prisma client instance.
 * @param identification - Either the user's ID or the user's session ID.
 * @returns A promise that resolves to an array of tickets.
 */
export const getTickets = async (
  prisma: PrismaClient,
  identification: ShopIdentification,
): Promise<TicketWithMoreInfo[]> => {
  const dbId = dbIdentification(identification);
  const tenDaysAgo = dayjs().subtract(10, "days").toDate();
  const tickets = await prisma.ticket.findMany({
    where: {
      shoppable: {
        AND: [
          { OR: [{ removedAt: null }, { removedAt: { lt: new Date() } }] },
          {
            OR: [
              { availableTo: null },
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
    include: ticketIncludedFields(dbId),
    orderBy: {
      shoppable: {
        availableFrom: "asc",
      },
    },
  });
  return tickets.map(formatTicket);
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
