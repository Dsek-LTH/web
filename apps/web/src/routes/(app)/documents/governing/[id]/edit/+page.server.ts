import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { redirect } from "sveltekit-flash-message/server";
import { governingDocumentSchema } from "../../schemas";
import * as m from "$paraglide/messages";
import { serverApi } from "$lib/server/apiClient";
import { goError, requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

// governing_document:write is enforced by the Go API itself - same
// "old app had no explicit check" note as the new/ page's create action.
export const load: PageServerLoad = async (event) => {
  const { params } = event;
  requirePolicy(event.locals.user, apiNames.GOVERNING_DOCUMENT.UPDATE);
  const res = await serverApi(event).GET("/governing-documents/{id}", {
    params: { path: { id: params.id } },
  });
  if (res.error)
    goError(res.response, res.error, m.documents_governing_errors_notFound());
  const governingDocument = res.data;

  return {
    governingDocument,
    form: await superValidate(
      {
        url: governingDocument.url,
        title: governingDocument.title,
        type: governingDocument.type as "POLICY" | "GUIDELINE",
      },
      zod4(governingDocumentSchema),
    ),
  };
};

export const actions: Actions = {
  update: async (event) => {
    const { request, params } = event;
    const form = await superValidate(request, zod4(governingDocumentSchema));
    if (!form.valid) return fail(400, { form });
    const { url, title, type } = form.data;
    const updated = await serverApi(event).PUT("/governing-documents/{id}", {
      params: { path: { id: params.id } },
      body: { url, title, type },
    });
    if (updated.error)
      goError(
        updated.response,
        updated.error,
        "Failed to update governing document",
      );
    throw redirect(
      "/documents/governing",
      {
        message: m.documents_governing_documentUpdated(),
        type: "success",
      },
      event,
    );
  },
};
