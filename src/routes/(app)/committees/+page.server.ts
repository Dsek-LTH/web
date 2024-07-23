import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { CacheDependency, TIME_IN_MS } from "$lib/utils/caching/cache";
import { globallyCached } from "$lib/utils/caching/cached";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const committees = await globallyCached(
    "committees",
    () =>
      authorizedPrismaClient.committee.findMany({
        include: {
          positions: {
            select: {
              mandates: {
                where: {
                  startDate: {
                    lte: new Date(),
                  },
                  endDate: {
                    gte: new Date(),
                  },
                },
                select: {
                  memberId: true,
                },
              },
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      }),
    [CacheDependency.MANDATES_AND_POSITIONS],
    TIME_IN_MS.ONE_HOUR,
  );
  return {
    committees,
  };
};
