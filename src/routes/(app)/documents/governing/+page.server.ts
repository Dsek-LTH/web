import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { getYearOrThrowSvelteError } from "$lib/utils/url.server";
import { deleteFileSchema } from "../schemas";

export const load: PageServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const year = getYearOrThrowSvelteError(url);
  const governingDocuments = await prisma.document
    .findMany({
      orderBy: {
        title: "asc",
      },
    })
    .then((documents) => {
      const filterDocuments = (type: string, filterByDate: boolean) =>
        documents.filter(
          (document) =>
            document.type === type &&
            (filterByDate ? document.createdAt.getFullYear() == year : true),
        );

      return {
        policies: filterDocuments("POLICY", false),
        guidelines: filterDocuments("GUIDELINE", false),
        plansOfOperations: filterDocuments("PLAN_OF_OPERATIONS", true),
        frameworkBudgets: filterDocuments("FRAMEWORK_BUDGET", true),
        strategicGoals: filterDocuments("STRATEGIC_GOALS", true),
      };
    });

  return {
    policies: governingDocuments.policies,
    plansOfOperations: governingDocuments.plansOfOperations,
    frameworkBudgets: governingDocuments.frameworkBudgets,
    strategicGoals: governingDocuments.strategicGoals,
    guidelines: governingDocuments.guidelines,
    deleteForm: await superValidate(zod4(deleteFileSchema)),
  };
};

export const actions: Actions = {
  deleteFile: async ({ request, locals }) => {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(deleteFileSchema));
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
