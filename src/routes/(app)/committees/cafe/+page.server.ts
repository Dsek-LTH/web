import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const yearQuery = url.searchParams.get("year");
  const parsedYear = parseInt(yearQuery ?? "");
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
  const openingHours = prisma.markdown.findMany({
    where: {
      name: {
        startsWith: "cafe:open",
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  return committeeLoad(prisma, "cafe", year).then(async (data) => ({
    ...data,
    openingHours: await openingHours,
  }));
};

export const actions = committeeActions("cafe");
