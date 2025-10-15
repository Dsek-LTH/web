import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { emailAliasSchema } from "./helpers";
import {
  fetchEmailGroups,
  createEmailGroup,
  deleteEmailGroup,
} from "$lib/server/authentik";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";


export const load: PageServerLoad = async ({ locals }) => {
  authorize(apiNames.EMAIL_ALIAS.READ, locals.user);

  const emailAliases = fetchEmailGroups.get();

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
    authorize(apiNames.EMAIL_ALIAS.CREATE, locals.user);

    const form = await superValidate(request, zod(emailAliasSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { alias, domain } = form.data;
    const email = `${alias}@${domain}`;

    if ((await fetchEmailGroups.get()).some(alias => alias.mail == email)) {
      // throw error(500, "mailalias: " + email + " already exists");
      throw error(500, m.admin_emailalias_duplicateError({ email: email }));
    } else {
      // pk is primary key, which we call id in this context
      const id = (await createEmailGroup(email))?.pk;
      redirect(303, `email-alias/${id}`);
    }
  },
  delete: async ({ locals, request }) => {
    authorize(apiNames.EMAIL_ALIAS.DELETE, locals.user);

    const data = await request.formData();
    const id = data.get("id");
    if (typeof id !== "string" || !id) throw error(400, "Missing id");

    await deleteEmailGroup(id);
  },
};
