import { createDbaySchema } from "$lib/dbay/schema";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { redirect } from "$lib/utils/redirect.js";

export const load = async (event) => {
  const { request, locals } = event;
  const { user } = locals;
  authorize(apiNames.MEMBER.CREATE, user);
  const form = await superValidate(request, zod(createDbaySchema));
  return { form };
};

export const actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    authorize(apiNames.MEMBER.CREATE, user);
    const form = await superValidate(request, zod(createDbaySchema));
    if (!form.valid) return fail(400, { form });
    await prisma.dbay.create({ data: form.data });

    throw redirect(
      "/dbay",
      {
        message: "Listing Created",
        type: "success",
      },
      event,
    );
  },
};
