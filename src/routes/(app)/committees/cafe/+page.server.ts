import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import { globallyCached } from "$lib/utils/caching/cached";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { CacheDependency } from "$lib/utils/caching/cache";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { user, prisma } = locals;
  const yearQuery = url.searchParams.get("year");
  const parsedYear = parseInt(yearQuery ?? "");
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
  const openingHours = globallyCached(
    "cafeOpenTimes",
    () =>
      authorizedPrismaClient.markdown.findMany({
        where: {
          name: {
            startsWith: "cafe:open",
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    [CacheDependency.CAFE_OPEN_TIMES],
  );
  return committeeLoad(user, prisma, "cafe", year).then(async (data) => ({
    ...data,
    openingHours: await openingHours,
  }));
};

export const actions = committeeActions("cafe");
