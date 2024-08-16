import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad, getYear } from "../committee.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const year = getYear(url);
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
  });
  return committeeLoad(prisma, "nollu", url).then(async (data) => ({
    ...data,
    phadderGroups: await phadderGroups,
  }));
};

export const actions = committeeActions("cafe");
