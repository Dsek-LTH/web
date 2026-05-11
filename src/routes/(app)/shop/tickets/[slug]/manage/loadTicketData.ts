import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { mentorMandateFilter } from "$lib/nollning/groups/types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import type { AuthUser } from "@zenstackhq/runtime";

export const loadTicketData = async (
  prisma: ExtendedPrisma,
  user: AuthUser,
  ticketId: string,
) => {
  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
    include: {
      shoppable: {
        include: {
          questions: true, // including questions where removedAt is not null, because we want to show them as well
          consumables: {
            include: {
              member: true,
              questionResponses: true,
            },
          },
          reservations: {
            include: {
              member: true,
            },
          },
        },
      },
      event: true,
    },
  });
  if (!ticket) throw error(404, "Ticket not found");
  if (ticket.shoppable.authorId !== user.memberId) {
    // author can always manage
    authorize(apiNames.WEBSHOP.MANAGE, user);
  }
  const ticketYear = ticket.event.startDatetime.getFullYear();
  const memberWithMentorGroups = await prisma.member.findMany({
    where: {
      id: {
        in: ticket.shoppable.consumables
          .map((c) => c.member?.id)
          .filter(Boolean) as string[],
      },
    },
    include: {
      nollaIn: true,
      mandates: {
        where: {
          ...mentorMandateFilter(ticketYear),
          NOT: {
            mentorIn: null,
          },
        },
        include: {
          mentorIn: true,
        },
      },
    },
  });
  const consumables = ticket.shoppable.consumables.map((c) => {
    const member = memberWithMentorGroups.find((m) => m.id === c.member?.id);
    const mentorIn = member?.mandates[0]?.mentorIn ?? null;
    const nollaIn =
      member?.nollaIn?.year === ticketYear ? member.nollaIn : null;
    return {
      ...c,
      member: c.member
        ? {
            ...c.member,
            mentorGroup: mentorIn ?? nollaIn,
          }
        : c.member,
    };
  });
  return {
    consumables,
    ticket,
  };
};
