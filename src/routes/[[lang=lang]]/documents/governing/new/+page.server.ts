import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { governingDocumentSchema } from "../schemas";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  form: await superValidate(governingDocumentSchema),
});

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const form = await superValidate(request, governingDocumentSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.GOVERNING_DOCUMENT.CREATE,
      session?.user,
      async () => {
        const { url, title, type } = form.data;
        await prisma.document.create({
          data: {
            url,
            title,
            type,
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
