import apiNames from "$lib/utils/apiNames";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { authorize } from "$lib/utils/authorization";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ACCESS_POLICY.READ, user);

  const accessPolicies = await prisma.accessPolicy.findMany().then((policies) =>
    policies
      .map((policy) => policy.apiName)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort(),
  );
  const form = await superValidate(createSchema);
  return {
    accessPolicies,
    form,
  };
};

const createSchema = z.object({
  apiName: z.string().default(""),
});

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const { prisma } = locals;
    const form = await superValidate(request, createSchema);
    if (!form.valid) return fail(400, { form });

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
};
