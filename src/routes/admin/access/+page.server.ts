import { policyAccessGuard, withAccess } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const allPolicies = await prisma.accessPolicy.findMany(); // fetch it immidiately to reduce waterfall delay
  const { accessPolicies } = await parent();
  policyAccessGuard(apiNames.ACCESS_POLICY.READ, accessPolicies);
  const form = await superValidate(createSchema);
  return {
    allPolicies,
    form,
  };
};

const createSchema = z.object({
  apiName: z.string().default(""),
});

export const actions = {
  create: async ({ locals, request }) => {
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });
    const session = await locals.getSession();
    return withAccess(
      apiNames.ACCESS_POLICY.CREATE,
      session?.user,
      async () => {
        await prisma.accessPolicy.create({
          data: {
            apiName: form.data.apiName,
            role: "*",
          },
        });
        return message(form, {
          message: "Access policy skapad",
          type: "success",
        });
      },
      form
    );
  },
};
