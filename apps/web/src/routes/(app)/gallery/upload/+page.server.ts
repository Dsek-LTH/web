import { multipart } from "$lib/api/client";
import { serverApi } from "$lib/server/apiClient";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";
import { fail, redirect } from "@sveltejs/kit";
import type { ErrorStatus } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { studentIds } from "../memberSchema";
import type { Actions, PageServerLoad } from "./$types";
import { uploadSchema } from "./types";

export const load: PageServerLoad = async ({ locals }) => {
  // Go needs both to create an album.
  requirePolicy(locals.user, apiNames.GALLERY.CREATE);
  requirePolicy(locals.user, apiNames.FILES.BUCKET("albums").CREATE);
  const form = await superValidate(zod4(uploadSchema));
  return { form };
};

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event.request, zod4(uploadSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const { title, date, description, photographers, editors } = form.data;
    const res = await serverApi(event).POST("/albums", {
      body: {
        title,
        date: date.toISOString().slice(0, 10),
        description,
        photographers: studentIds(photographers),
        editors: studentIds(editors),
        cover: form.data.coverFile,
        files: form.data.albumFiles,
      },
      ...multipart,
    });
    if (res.error) {
      return message(
        withFiles(form),
        {
          message: res.error.detail ?? m.gallery_upload_failed(),
          type: "error",
        },
        { status: res.response.status as ErrorStatus },
      );
    }
    redirect(303, `/gallery/album/${res.data.slug}`);
  },
};
