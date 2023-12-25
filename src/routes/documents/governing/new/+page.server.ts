import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import type { GoverningDocumentType } from "@prisma/client";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { governingDocumetSchema } from "../schemas.js";

export const load = async () => ({
  form: await superValidate(governingDocumetSchema),
});

export const actions = {
  create: async (event) => {
    const { request, locals } = event;
    const form = await superValidate(request, governingDocumetSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.GOVERNING_DOCUMENT.CREATE,
      session?.user,
      async () => {
        const { url, title, documentType } = form.data;
        await prisma.governingDocument.create({
          data: {
            url,
            title,
            documentType: documentType as GoverningDocumentType,
          },
        });
        throw redirect(
          "/documents/governing",
          {
            message: "Styrdokument skapat",
            type: "success",
          },
          event,
        );
      },
      form,
    );
  },
};
