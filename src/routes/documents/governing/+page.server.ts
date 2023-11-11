import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail } from "@sveltejs/kit";
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

export const actions = {
  deleteFile: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.GOVERNING_DOCUMENT.DELETE, session?.user, async () => {
      const data = await request.formData();
      const id = data.get("id");
      if (typeof id !== "string" || id === undefined) {
        return fail(400, { id, missing: true });
      }
      try {
        await prisma.governingDocument.delete({
          where: {
            id,
          },
        });
        return {
          success: true,
        };
      } catch (e) {
        return fail(500, { id, error: "Unknown error" });
      }
    });
  },
};
