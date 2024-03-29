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
    const { prisma } = locals;
    const form = await superValidate(request, governingDocumentSchema);
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
        message: "Styrdokument skapat",
        type: "success",
      },
      event,
    );
  },
};
