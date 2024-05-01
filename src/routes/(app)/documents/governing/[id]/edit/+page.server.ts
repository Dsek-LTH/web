import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { redirect } from "$lib/utils/redirect";
import { governingDocumentSchema } from "../../schemas";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { prisma } = locals;
  const governingDocument = await prisma.document.findFirst({
    where: {
      id: params.id,
    },
  });

  if (!governingDocument) {
    throw error(404, "Governing document not found");
  }

  return {
    governingDocument,
    form: await superValidate(governingDocumentSchema),
  };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, locals, params } = event;
    const { prisma } = locals;
    const form = await superValidate(request, governingDocumentSchema);
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
        message: "Styrdokument uppdaterat",
        type: "success",
      },
      event,
    );
  },
};
