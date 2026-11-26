import { serverApi } from "$lib/server/apiClient";
import { goError, requireCanEdit } from "$lib/utils/access";
import * as m from "$paraglide/messages";
import { fail, redirect } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import type { ErrorStatus } from "sveltekit-superforms";
import { message, superValidate } from "sveltekit-superforms/server";
import { editSchema } from "../types";
import { studentIds } from "../../../memberSchema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const res = await serverApi(event).GET("/albums/{slug}", {
    params: { path: { slug: event.params.slug } },
  });
  if (res.error) goError(res.response, res.error, m.gallery_album_not_found());
  const album = res.data;
  requireCanEdit(event.locals.user, album.canEdit);

  return {
    id: album.id,
    slug: album.slug,
    canDelete: album.canDelete,
    form: await superValidate(
      {
        title: album.title,
        date: new Date(album.date),
        description: album.description,
        photographers: album.photographers,
        editors: album.editors,
      },
      zod4(editSchema),
    ),
  };
};

export const actions: Actions = {
  save: async (event) => {
    const form = await superValidate(event.request, zod4(editSchema));
    if (!form.valid) return fail(400, { form });

    const { title, date, description, photographers, editors } = form.data;
    const res = await serverApi(event).PUT("/albums/{slug}", {
      params: { path: { slug: event.params.slug } },
      body: {
        title,
        date: date.toISOString().slice(0, 10),
        description,
        photographers: studentIds(photographers),
        editors: studentIds(editors),
      },
    });
    if (res.error) {
      return message(
        form,
        { message: res.error.detail ?? m.gallery_save_failed(), type: "error" },
        { status: res.response.status as ErrorStatus },
      );
    }
    redirect(303, `/gallery/album/${res.data.slug}`);
  },
};
