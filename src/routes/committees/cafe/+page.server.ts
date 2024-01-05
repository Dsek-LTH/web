import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import prisma from "$lib/utils/prisma";

export const load: PageServerLoad = () => {
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
