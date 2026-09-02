import { fail } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { governingDocumentSchema } from "../schemas";
import type { Actions, PageServerLoad } from "./$types";
import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";

// governing_document:write is enforced by the Go API itself
// (backend/internal/governingdocs) - a real, necessary explicit check Go
// adds that the old app's action never had (it relied purely on
// ZenStack's model-level policy, with no fallback for a Go-backed world).
export const load: PageServerLoad = async () => ({
  form: await superValidate(zod4(governingDocumentSchema)),
});

export const actions: Actions = {
  create: async (event) => {
    const { request } = event;
    const form = await superValidate(request, zod4(governingDocumentSchema));
    if (!form.valid) return fail(400, { form });
    const { url, title, type } = form.data;
    const created = await api.POST("/governing-documents", {
      body: { url, title, type },
    });
    if (created.error) throw new Error("Failed to create governing document");
    throw redirect(
      "/documents/governing",
      {
        message: m.documents_governing_documentCreated(),
        type: "success",
      },
      event,
    );
  },
};
