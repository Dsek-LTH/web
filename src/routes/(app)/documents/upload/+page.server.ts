import * as m from "$paraglide/messages";
import { fail } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { uploadSchema } from "./types";
import { uploadDocumentsFile } from "./uploadFiles";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const { user } = locals;
    const form = await superValidate(request, zod(uploadSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));
    try {
      await uploadDocumentsFile(user, form.data);
    } catch (e) {
      return message(
        form,
        {
          message: e instanceof Error ? e.message : `${e}`,
          type: "error",
        },
        { status: 500 },
      );
    }
    // Clear file and name
    form.data.file = null as unknown as File; // will work, but not type correct
    form.data.name = "";
    return message(form, {
      message: m.documents_fileUploaded(),
      type: "success",
    });
  },
};
