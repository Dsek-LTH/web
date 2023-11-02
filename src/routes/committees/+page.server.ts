import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const committees = await prisma.committee.findMany();
  return {
    committees,
  };
};
