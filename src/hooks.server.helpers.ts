import { dev } from "$app/environment";
import { isN0llningPeriod } from "$lib/utils/adminSettings/nollning";
import apiNames from "$lib/utils/apiNames";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

const fetchAccessPolicies = async (
  prisma: ExtendedPrisma,
  roles: string[],
  studentId?: string,
) => {
  const isN0llning = await isN0llningPeriod();
  return prisma.accessPolicy
    .findMany({
      where: {
        OR: [{ role: { in: roles } }, { studentId }],
      },
    })
    .then((policies) => policies.map((p) => p.apiName))
    .then((policies) => {
      /**
       * Stab hide functionality: when outside of the n0llning everyone has the
       * access policy "SEE_THE_STAB", but during n0llning only those who get it
       * due to their roles can see the stab.
       */
      if (!isN0llning && !policies.includes(apiNames.MEMBER.SEE_THE_STAB)) {
        policies.push(apiNames.MEMBER.SEE_THE_STAB);
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
const hasCacheExpired = (cache: typeof accessPoliciesCache) =>
  !cache.lastUpdated || // no cache
  Date.now() - cache.lastUpdated > CACHE_TTL;

/**
 * @param prisma
 * @param ctx session.user
 * @returns e.g. `["news:create", "news:like", ...etc]`
 */
export const getAccessPolicies = async (
  prisma: ExtendedPrisma,
  roles: string[],
  studentId?: string,
) => {
  // If we're running in development mode and we're signed in,
  // give all available policies to the user.
  if (!!studentId && dev) {
    return getAllAccessPolicies(prisma);
  }

  // only has *, i.e logged out user
  if (roles.length === 1) {
    if (hasCacheExpired(accessPoliciesCache)) {
      accessPoliciesCache.policies = await fetchAccessPolicies(
        prisma,
        roles,
        undefined,
      );
      accessPoliciesCache.lastUpdated = Date.now();
    }
    return accessPoliciesCache.policies;
  }

  return await fetchAccessPolicies(prisma, roles, studentId);
};

/** Should only be used in development mode. */
const getAllAccessPolicies = async (prisma: ExtendedPrisma) =>
  prisma.accessPolicy
    .findMany({ distinct: "apiName" })
    .then((policies) => policies.map((p) => p.apiName));
