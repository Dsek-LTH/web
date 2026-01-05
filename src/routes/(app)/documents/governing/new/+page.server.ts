import { fail } from "@sveltejs/kit";
import { redirect } from "$lib/utils/redirect";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { governingDocumentSchema } from "../schemas";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async () => ({
  form: await superValidate(zod4(governingDocumentSchema)),
});

export const actions: Actions = {
  create: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod4(governingDocumentSchema));
    if (!form.valid) return fail(400, { form });
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
        message: m.documents_governing_documentCreated(),
        type: "success",
      },
      event,
    );
  },
};
