import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = ({ locals }) => {
  const { prisma } = locals;
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

  return committeeLoad("cafe").then(async (data) => ({
    ...data,
    openingHours: await openingHours,
  }));
};

export const actions = committeeActions("cafe");
