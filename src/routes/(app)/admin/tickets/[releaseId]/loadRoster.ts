import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import {
  getTicketRelease,
  listTicketEntries,
} from "$lib/server/ticketService";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { AuthUser } from "@zenstackhq/runtime";

// WEBSHOP.MANAGE (not READ_PURCHASES) because that's also the policy that
// gates reading a member's foodPreference field - using anything narrower
// here would let someone view this page but see blank food preferences.
export const loadRoster = async (
  prisma: ExtendedPrisma,
  user: AuthUser,
  request: Request,
  releaseId: string,
) => {
  authorize(apiNames.WEBSHOP.MANAGE, user);

  const [release, entries] = await Promise.all([
    getTicketRelease(request, releaseId),
    listTicketEntries(request, releaseId),
  ]);

  const members = await prisma.member.findMany({
    where: { studentId: { in: entries.map((e) => e.memberId) } },
    select: {
      studentId: true,
      firstName: true,
      lastName: true,
      nickname: true,
      picturePath: true,
      foodPreference: true,
    },
  });
  const memberByStudentId = new Map(members.map((m) => [m.studentId, m]));

  const roster = entries.map((entry) => ({
    ...entry,
    member: memberByStudentId.get(entry.memberId) ?? null,
  }));

  return { release, roster };
};
