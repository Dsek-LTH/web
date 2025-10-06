import type { Actions, PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { error } from "@sveltejs/kit";
import {
  addEmailGroupRecipient,
  fetchEmailGroup,
  removeEmailGroupRecipient,
} from "$lib/server/authentik";
import { ResponseError } from "@goauthentik/api";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { emailFormSchema } from "../helpers";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, params }) => {
  authorize(apiNames.EMAIL_ALIAS.READ, locals.user);

  const emailAlias = fetchEmailGroup(params.id).catch((e) => {
    if (e instanceof ResponseError) {
      console.error(e);
      throw error(e.response.status, "authentik error");
    }
    throw e;
  });

  return {
    emailAlias: await emailAlias,
    form: await superValidate(zod(emailFormSchema)),
  };
};

export const actions: Actions = {
  add: async ({ locals, request, params }) => {
    authorize(apiNames.EMAIL_ALIAS.UPDATE, locals.user);

    const form = await superValidate(request, zod(emailFormSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { email } = form.data;
    await addEmailGroupRecipient(params.id, email);

    return message(form, {
      message: "Recipient added!",
      type: "success",
    });
  },
  remove: async ({ locals, request, params }) => {
    authorize(apiNames.EMAIL_ALIAS.UPDATE, locals.user);

    const data = await request.formData();
    const email = data.get("email");
    if (typeof email !== "string" || !email) throw error(400, "Missing email");

    await removeEmailGroupRecipient(params.id, email);
  },
};
