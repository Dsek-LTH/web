import type { PageServerLoad, Actions } from "./$types";
import { committeeActions } from "../committee.server";

export const load: PageServerLoad = async (event) => {
  const { locals } = event;
  const { prisma } = locals;

  const openingHours = await prisma.markdown.findMany({
    where: {
      name: {
        startsWith: "cafe:open",
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return { openingHours };
};

export const actions: Actions = {
  ...committeeActions("cafe"),
};
