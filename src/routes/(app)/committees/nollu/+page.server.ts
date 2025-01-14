import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  // Allow to see committees from 1982 to the NEXT year
  const year = getYearOrThrowSvelteError(
    url,
    1982,
    new Date().getFullYear() + 1,
  );
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
