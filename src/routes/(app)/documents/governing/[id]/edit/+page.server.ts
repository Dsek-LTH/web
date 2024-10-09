import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect";
import { governingDocumentSchema } from "../../schemas";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const governingDocument = await prisma.document.findFirst({
    where: {
      id: params.id,
    },
  });

  if (!governingDocument) {
    throw error(404, m.documents_governing_errors_notFound());
  }

  return {
    governingDocument,
    form: await superValidate(zod(governingDocumentSchema)),
  };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const { prisma } = locals;
    const form = await superValidate(request, zod(governingDocumentSchema));
    if (!form.valid) return fail(400, { form });
    const id = params.id;
    const { url, title, type } = form.data;
    await prisma.document.update({
      where: {
        id,
      },
      data: {
        url,
        title,
        type,
        updatedAt: new Date(),
      },
    });
    throw redirect(
      "/documents/governing",
      {
        message: m.documents_governing_documentUpdated(),
        type: "success",
      },
      event,
    );
  },
};
