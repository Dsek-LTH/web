import prisma from "$lib/utils/prisma";
import { error, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import type { GoverningDocumentType } from "@prisma/client";
import { superValidate } from "sveltekit-superforms/server";
import { redirect } from "sveltekit-flash-message/server";
import { governingDocumetSchema } from "../../schemas";

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
    form: await superValidate(governingDocumetSchema),
  };
};

export const actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const form = await superValidate(request, governingDocumetSchema);
    if (!form.valid) return fail(400, { form });
    const id = params.id;
    const session = await locals.getSession();
    return withAccess(
      apiNames.GOVERNING_DOCUMENT.CREATE,
      session?.user,
      async () => {
        const { url, title, documentType } = form.data;
        await prisma.governingDocument.update({
          where: {
            id: id as string,
          },
          data: {
            url,
            title,
            documentType: documentType as GoverningDocumentType,
            updatedAt: new Date(),
          },
        });
        throw redirect(
          "/documents/governing",
          {
            message: "Styrdokument uppdaterat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
