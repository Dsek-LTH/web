import { committeeActions } from "../committee.server";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
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

export const actions = committeeActions();
