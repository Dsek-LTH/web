import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";
import { BASIC_EVENT_FILTER } from "$lib/events/events";
import { type Prisma } from "@prisma/client";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";
import dayjs from "dayjs";
import {
  dbIdentification,
  type DBShopIdentification,
  GRACE_PERIOD_WINDOW,
} from "./types";

export type TicketWithMoreInfo =
  & ExtendedPrismaModel<"Ticket">
  & ExtendedPrismaModel<"Shoppable">
  & {
    userItemsInCart: Array<ExtendedPrismaModel<"Consumable">>;
    userReservations: Array<ExtendedPrismaModel<"ConsumableReservation">>;
    event: ExtendedPrismaModel<"Event"> & {
      tags: Array<ExtendedPrismaModel<"Tag">>;
    };
    gracePeriodEndsAt: Date;
    isInUsersCart: boolean;
    userAlreadyHasMax: boolean;
    ticketsLeft: number;
    hasQueue: boolean;
  };

export const ticketIncludedFields = (id: DBShopIdentification) => ({
  shoppable: {
    include: {
      // Get the user's consumables and reservations for this ticket
      consumables: {
        where: {
          ...id,
          OR: [
            { purchasedAt: { not: null } },
            { expiresAt: { gt: new Date() } },
            { expiresAt: null },
          ],
        },
      },
      reservations: { where: { ...id } },
      _count: {
        select: {
          // Number of bought tickets
          consumables: {
            where: { purchasedAt: { not: null } },
          },
          reservations: {
            where: { order: { not: null } },
          },
        },
      },
    },
  },
  event: { include: { tags: true } },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for its type in getTicketFromPrisma
const getTicketFromPrisma = (prisma: ExtendedPrisma) =>
  prisma.ticket.findFirst({
    include: ticketIncludedFields({ memberId: "" }),
  });

/**
 * This is a replacement for:
 *
 * ```ts
 * type TicketInclude = ReturnType<typeof ticketIncludedFields>;
 * type TicketFromPrisma = Prisma.TicketGetPayload<{ include: TicketInclude }>;
 * ```
 * which is necessary because `ExtendedPrisma` does not have any `GetPayload` types.
 */
type TicketFromPrisma = NonNullable<
  Awaited<ReturnType<typeof getTicketFromPrisma>>
>;

export const formatTicket = (ticket: TicketFromPrisma): TicketWithMoreInfo => {
  const base:
    & TicketWithMoreInfo
    & Partial<
      & Pick<
        TicketFromPrisma["shoppable"],
        "consumables" | "reservations" | "_count"
      >
      & Pick<TicketFromPrisma, "shoppable">
    > = {
      ...ticket.shoppable,
      ...ticket,
      userItemsInCart: ticket.shoppable.consumables.filter((c) =>
        !c.purchasedAt
      ),
      userReservations: ticket.shoppable.reservations,
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
      hasQueue: ticket.shoppable._count.reservations > 0,
    };
  // do not show the following info to the client
  delete base.consumables;
  delete base.reservations;
  delete base.shoppable;
  delete base._count;
  return base;
};

const shoppableAccessPolicyFilter = (
  userRoles: string[],
  studentId?: string,
) => ({
  OR: [
    {
      accessPolicies: { none: {} }, // no access policies exist
    },
    {
      accessPolicies: {
        some: studentId
          ? {
            OR: [{ role: { in: userRoles } }, { studentId }],
          }
          : { role: { in: userRoles } },
      },
    },
  ],
});

export const getTicket = async (
  prisma: ExtendedPrisma,
  id: string,
  user: AuthUser,
): Promise<TicketWithMoreInfo | null> => {
  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) throw error(401);
  const identification = memberId
    ? {
      memberId: memberId,
    }
    : {
      externalCode: externalCode!,
    };
  const dbId = dbIdentification(identification);
  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      shoppable: { ...shoppableAccessPolicyFilter(user.roles, user.studentId) },
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
  prisma: ExtendedPrisma,
  user: AuthUser,
  getAll = false,
): Promise<TicketWithMoreInfo[]> => {
  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) throw error(401);
  const identification = memberId
    ? {
      memberId: memberId,
    }
    : {
      externalCode: externalCode!,
    };
  const dbId = dbIdentification(identification);
  const tenDaysAgo = dayjs().subtract(10, "days").toDate();
  const tickets = await prisma.ticket.findMany({
    where: getAll ? undefined : {
      shoppable: {
        AND: [
          { OR: [{ removedAt: null }, { removedAt: { lt: new Date() } }] },
          {
            // show items which were available in the last 10 days
            OR: [
              { availableTo: null },
              { availableTo: { gt: tenDaysAgo } },
            ],
          },
        ],
        ...shoppableAccessPolicyFilter(user.roles, user.studentId),
      },
    },
    include: ticketIncludedFields(dbId),
    orderBy: {
      shoppable: { availableFrom: getAll ? "desc" : "asc" },
    },
  });
  return tickets.map(formatTicket);
};

/**
 * Retrieves tickets from the database based on the provided shop identification.
 * @param prisma - The Prisma client instance.
 * @param identification - Either the user's ID or the user's session ID.
 * @returns A promise that resolves to an array of tickets.
 */
export const getEventsWithTickets = async (
  prisma: ExtendedPrisma,
  user: AuthUser,
  filters: Prisma.EventWhereInput = {},
  nollningMode: boolean | null = false,
) => {
  const { memberId, externalCode } = user ?? {};
  if (!memberId && !externalCode) throw error(401);
  const identification = memberId
    ? {
      memberId: memberId,
    }
    : {
      externalCode: externalCode!,
    };
  const dbId = dbIdentification(identification);

  const events = await prisma.event.findMany({
    where: {
      ...BASIC_EVENT_FILTER(nollningMode),
      ...filters,
    },
    orderBy: {
      startDatetime: "asc",
    },
    include: {
      tickets: {
        where: {
          shoppable: {
            ...shoppableAccessPolicyFilter(user.roles, user.studentId),
          },
        },
        include: {
          ...ticketIncludedFields(dbId),
          event: false,
        },
      },
      tags: true,
    },
  });

  return events.map((event) => ({
    ...event,
    tickets: event.tickets.map((ticket) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- We want to "drop" tickets from event data nested into the ticket
      const { tickets: _, ...eventData } = event;
      return formatTicket({
        ...ticket,
        event: eventData,
      });
    }),
  }));
};
