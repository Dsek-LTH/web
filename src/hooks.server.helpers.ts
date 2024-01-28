import { dev } from "$app/environment";
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
  if (dev) {
    return getAllAccessPolicies(prisma);
  }
  return prisma.accessPolicy
    .findMany({
      where: {
        OR: [
          { role: { in: getDerivedRoles(groupList, !!studentId) } },
          { studentId },
        ],
      },
    })
    .then((policies) => policies.map((p) => p.apiName));
};

/** Should only be used in development mode. */
const getAllAccessPolicies = async (prisma: PrismaClient) =>
  prisma.accessPolicy
    .findMany({ distinct: "apiName" })
    .then((policies) => policies.map((p) => p.apiName));
