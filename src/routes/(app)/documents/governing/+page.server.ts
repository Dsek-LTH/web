import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const governingDocuments = await prisma.document
    .findMany({ where: { deletedAt: null } })
    .then((documents) => ({
      policies: documents.filter((document) => document.type === "POLICY"),
      guidelines: documents.filter((document) => document.type === "GUIDELINE"),
    }));

  return {
    policies: governingDocuments.policies,
    guidelines: governingDocuments.guidelines,
    deleteForm: await superValidate(zod(deleteSchema)),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod(deleteSchema));
    if (!form.valid) return fail(400, { form });
    const { id } = form.data;
    await prisma.document.delete({
      where: {
        id,
      },
    });
    return message(form, {
      message: m.documents_governing_documentDeleted(),
      type: "success",
    });
  },
};
