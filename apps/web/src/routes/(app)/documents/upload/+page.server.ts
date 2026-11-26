import * as m from "$paraglide/messages";
import { fail, type NumericRange } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import type { Actions, PageServerLoad } from "./$types";
import { multipart } from "$lib/api/client";
import { serverApi } from "$lib/server/apiClient";
import { uploadSchema } from "./types";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ locals }) => {
  // Meeting documents, or the SRD's files.
  requirePolicy(
    locals.user,
    apiNames.FILES.BUCKET("documents").CREATE,
    apiNames.FILES.BUCKET("files").CREATE,
  );
  const form = await superValidate(zod4(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event.request, zod4(uploadSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));
    // A real upload, so it goes through here; Go picks the bucket and path
    // from the type, year and folder, and records the group.
    const { type, year, folder, group, name, file } = form.data;
    const api = serverApi(event);
    const res =
      type === "requirement"
        ? await api.POST("/requirement-profiles", {
            body: { year, folder, name, file },
            ...multipart,
          })
        : await api.POST("/meeting-documents", {
            body: { type, year, folder, group, name, file },
            ...multipart,
          });
    if (res.error) {
      return message(
        form,
        {
          message: m.documents_errors_couldNotUploadFile({
            x: res.error.detail ?? res.response.statusText,
          }),
          type: "error",
        },
        { status: res.response.status as NumericRange<400, 599> },
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
