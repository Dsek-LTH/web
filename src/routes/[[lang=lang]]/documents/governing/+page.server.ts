import { withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

export const load: PageServerLoad = async () => {
  const governingDocuments = await prisma.document
    .findMany({ where: { deletedAt: null } })
    .then((documents) => ({
      policies: documents.filter((document) => document.type === "POLICY"),
      guidelines: documents.filter((document) => document.type === "GUIDELINE"),
    }));

  return {
    policies: governingDocuments.policies,
    guidelines: governingDocuments.guidelines,
    deleteForm: await superValidate(deleteSchema),
  };
};

const deleteSchema = z.object({
  id: z.string(),
});

export const actions = {
  deleteFile: async ({ request, locals }) => {
    const form = await superValidate(request, deleteSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.GOVERNING_DOCUMENT.DELETE,
      session?.user,
      async () => {
        const { id } = form.data;
        await prisma.document.delete({
          where: {
            id,
          },
        });
        return message(form, {
          message: "Styrdokument raderat",
          type: "success",
        });
      },
      form,
    );
  },
};
