import { dev } from "$app/environment";
import { isNollningPeriod } from "$lib/utils/adminSettings/nollning";
import apiNames from "$lib/utils/apiNames";
import { getDerivedRoles } from "$lib/utils/authorization";
import type { PrismaClient } from "@prisma/client";

const fetchAccessPolicies = async (
  prisma: PrismaClient,
  roles: string[],
  studentId?: string,
) => {
  const isNollning = await isNollningPeriod();
  const member = await prisma.member.findUnique({
    select: { classYear: true },
    where: { studentId: studentId },
  });
  return prisma.accessPolicy
    .findMany({
      where: {
        OR: [{ role: { in: roles } }, { studentId }],
      },
    })
    .then((policies) => policies.map((p) => p.apiName))
    .then((policies) => {
      /**
       * Stab hide functionality: when outside of the nollning everyone has the
       * access policy "SEE_STABEN", but during nollning only those who get it
       * due to their roles can see staben.
       */
      if (!isNollning && !policies.includes(apiNames.MEMBER.SEE_STABEN)) {
        policies.push(apiNames.MEMBER.SEE_STABEN);
      }
      if (isNollning && member?.classYear === new Date().getFullYear()) {
        policies.push("nolla");
      }
      return policies;
    });
};

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const accessPoliciesCache: { policies: string[]; lastUpdated: number | null } =
  {
    policies: [],
    lastUpdated: null,
  };

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
  const roles = getDerivedRoles(groupList, !!studentId);

  // only has *, i.e logged out user
  if (roles.length === 1) {
    if (
      accessPoliciesCache.lastUpdated &&
      Date.now() - accessPoliciesCache.lastUpdated > CACHE_TTL
    ) {
      accessPoliciesCache.policies = await fetchAccessPolicies(
        prisma,
        roles,
        studentId,
      );
      accessPoliciesCache.lastUpdated = Date.now();
    }
    return accessPoliciesCache.policies;
  }

  return await fetchAccessPolicies(prisma, roles, studentId);
};

/** Should only be used in development mode. */
const getAllAccessPolicies = async (prisma: PrismaClient) =>
  prisma.accessPolicy
    .findMany({ distinct: "apiName" })
    .then((policies) => policies.map((p) => p.apiName));
