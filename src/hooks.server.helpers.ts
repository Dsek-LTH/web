import { dev } from "$app/environment";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import apiNames from "$lib/utils/apiNames";
import { getDerivedRoles } from "$lib/utils/authorization";
import type { PrismaClient } from "@prisma/client";

/**
 * @param prisma
 * @param ctx session.user
 * @returns e.g. `["news:create", "news:like", ...etc]`
 */
export const getAccessPolicies = async (
  prisma: PrismaClient,
  studentId?: string,
  groupList?: string[],
) => {
  // If we're running in development mode and we're signed in,
  // give all available policies to the user.
  if (!!studentId && dev) {
    return getAllAccessPolicies(prisma);
  }
  const isNollning = await isNollningPeriod();
  return prisma.accessPolicy
    .findMany({
      where: {
        OR: [
          { role: { in: getDerivedRoles(groupList, !!studentId) } },
          { studentId },
        ],
      },
    })
    .then((policies) => policies.map((p) => p.apiName))
    .then((policies) => {
      // So how the stab hide functionality works is that when outside of the nollning everyone has the access policy "SEE_STABEN", but during nollning only those who get it due to their roles can see staben
      if (!isNollning && !policies.includes(apiNames.MEMBER.SEE_STABEN)) {
        policies.push(apiNames.MEMBER.SEE_STABEN);
      }
      return policies;
    });
};

/** Should only be used in development mode. */
const getAllAccessPolicies = async (prisma: PrismaClient) =>
  prisma.accessPolicy
    .findMany({ distinct: "apiName" })
    .then((policies) => policies.map((p) => p.apiName));
