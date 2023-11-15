import prisma from "$lib/utils/prisma";
import { error, fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import type { GoverningDocumentType } from "@prisma/client";

export const load: PageServerLoad = async ({ params }) => {
  const governingDocument = await prisma.governingDocument.findFirst({
    where: {
      id: params.id,
    },
  });

  if (!governingDocument) {
    throw error(404, "Governing document not found");
  }

  return {
    governingDocument,
  };
};

export const actions = {
  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    return withAccess(apiNames.GOVERNING_DOCUMENT.CREATE, session?.user, async () => {
      const data = await request.formData();
      const id = data.get("id");
      const url = data.get("url");
      if (typeof url !== "string" || url.length === 0) {
        return fail(400, { url, missing: true });
      }
      const title = data.get("title");
      if (typeof title !== "string" || title.length === 0) {
        return fail(400, { title, missing: true });
      }
      const documentType = data.get("documentType");
      if (typeof documentType !== "string" || documentType.length === 0) {
        return fail(400, { documentType, missing: true });
      }

      try {
        await prisma.governingDocument.update({
          where: {
            id: id as string,
          },
          data: {
            url,
            title,
            documentType: documentType as GoverningDocumentType,
          },
        });
      } catch (e) {
        return fail(500, { error: "Unknown error" });
      }
      throw redirect(303, "/documents/governing");
    });
  },
};
