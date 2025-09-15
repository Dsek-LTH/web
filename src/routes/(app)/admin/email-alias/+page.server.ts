import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { emailAliasSchema } from "./helpers";
import {
  fetchEmailGroups as _fetchEmailGroups,
  createEmailGroup,
  deleteEmailGroup,
} from "$lib/server/authentik";
import { withCache } from "$lib/utils/cache";
import { redirect } from "$lib/utils/redirect";

const fetchEmailGroups = withCache(_fetchEmailGroups);

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

    await createEmailGroup(email);
    fetchEmailGroups.invalidate();

    redirect(303, `email-alias/${email}`);
  },
  delete: async ({ locals, request }) => {
    authorize(apiNames.EMAIL_ALIAS.DELETE, locals.user);

    const data = await request.formData();
    const id = data.get("id");
    if (typeof id !== "string" || !id) throw error(400, "Missing id");

    await deleteEmailGroup(id);
    fetchEmailGroups.invalidate();
  },
};
