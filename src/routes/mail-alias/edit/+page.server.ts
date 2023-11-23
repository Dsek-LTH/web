import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const emailAliases = await prisma.emailAlias.findMany();
  const positions = await prisma.position.findMany({
    where: {
      active: true,
    },
  });

  return {
    emailAliases,
    positions,
  };
};
