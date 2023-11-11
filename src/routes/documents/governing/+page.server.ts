import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const governingDocuments = await prisma.governingDocument.findMany({
    where: {
      deletedAt: null,
    },
  });

  return {
    governingDocuments,
  };
};
