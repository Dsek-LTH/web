import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const currentYear = new Date().getFullYear();
  // Allow to see committees from 1982 to the NEXT year
  const year = getYearOrThrowSvelteError(url, {
    upperBound: currentYear + 1,
  });
  const phadderGroups = prisma.phadderGroup.findMany({
    where: {
      year,
    },
    include: {
      nollor: true,
      phaddrar: {
        include: {
          member: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return committeeLoad(prisma, "nollu", url).then(async (data) => ({
    ...data,
    phadderGroups: await phadderGroups,
  }));
};

export const actions = committeeActions("nollu");
