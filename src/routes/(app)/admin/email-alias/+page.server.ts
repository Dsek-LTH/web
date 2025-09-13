import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { emailAliasSchema } from "./helpers";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  authorize(apiNames.EMAIL_ALIAS.READ, locals.user);

  const emailAliases = prisma.emailAlias.findMany({
    orderBy: { email: "asc" },
  });

  return {
    emailAliases: await emailAliases,
    form: await superValidate(
      { alias: "", domain: "dsek.se" },
      zod(emailAliasSchema),
      { errors: false }, // Hide errors on initial load
    ),
  };
};

export const actions: Actions = {
  create: async ({ locals, request }) => {
    const { prisma } = locals;
    authorize(apiNames.EMAIL_ALIAS.CREATE, locals.user);

    const form = await superValidate(request, zod(emailAliasSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { alias, domain } = form.data;
    const email = `${alias}@${domain}`;

    await prisma.emailAlias.create({ data: { email } });

    redirect(303, `email-alias/${email}`);
  },
};
