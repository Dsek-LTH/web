import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { api } from "$lib/api/client";
import DOMPurify from "isomorphic-dompurify";
import { fail, message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";

// This page's +page.svelte is still <NotImplemented /> (no real UI built
// yet for this admin flow) - the load/actions below are still ported to
// the Go backend regardless, same "port the server logic even without a
// page.svelte" precedent as events' create/[slug]/edit routes (see
// backend/CLAUDE.md's events-routes section) - keeps this server code
// correct instead of leaving it silently broken (it referenced
// phadder_groups.year, which Go's Phase 2 nollning migration dropped)
// until someone builds the real UI.

export const load = async ({ locals, fetch }) => {
  const { user } = locals;
  authorize(apiNames.NOLLNING.MANAGE_PHADDER_GROUPS, user);

  const summariesRes = await api.GET("/nollning/groups", { fetch });
  const summaries = summariesRes.data ?? [];

  const groups = await Promise.all(
    summaries.map(async (summary) => {
      const detailRes = await api.GET("/nollning/groups/{id}", {
        fetch,
        params: { path: { id: summary.id } },
      });
      const group = detailRes.data ?? summary;
      return {
        ...group,
        form: await superValidate(group, zod4(phadderGroupSchema)),
      };
    }),
  );

  return {
    groups,
    form: await superValidate(zod4(createPhadderGroupSchema)),
  };
};

const phadderGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  seasonId: z.string().uuid(),
  imageUrl: z.string().nullable(),
});
const createPhadderGroupSchema = phadderGroupSchema.omit({ id: true });
const updatePhadderGroupSchema = phadderGroupSchema;
const deletePhadderGroupSchema = phadderGroupSchema.pick({ id: true });

const personSchema = z.object({
  memberId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const actions = {
  create: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(createPhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const description = form.data.description
      ? DOMPurify.sanitize(form.data.description)
      : form.data.description;
    const res = await api.POST("/nollning/groups", {
      fetch,
      body: { ...form.data, description },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: "Phaddergruppen skapades",
      type: "success",
    });
  },
  update: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(updatePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const description = form.data.description
      ? DOMPurify.sanitize(form.data.description)
      : form.data.description;
    const res = await api.PATCH("/nollning/groups/{id}", {
      fetch,
      params: { path: { id: form.data.id } },
      body: { ...form.data, description },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: "Phaddergruppen uppdaterad",
      type: "success",
    });
  },
  delete: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(deletePhadderGroupSchema));
    if (!form.valid) return fail(400, { form });
    const res = await api.DELETE("/nollning/groups/{id}", {
      fetch,
      params: { path: { id: form.data.id } },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: "Phaddergruppen borttagen",
      type: "success",
    });
  },
  addNolla: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await api.POST("/nollning/groups/{id}/nollor", {
      fetch,
      params: { path: { id: form.data.groupId } },
      body: { memberId: form.data.memberId },
    });
    if (res.error) return setError(form, "memberId", res.error.detail ?? "");
    return message(form, {
      message: "Nolla tillagd",
      type: "success",
    });
  },
  removeNolla: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await api.DELETE("/nollning/groups/{id}/nollor/{memberId}", {
      fetch,
      params: { path: { id: form.data.groupId, memberId: form.data.memberId } },
    });
    if (res.error) return setError(form, "memberId", res.error.detail ?? "");
    return message(form, {
      message: "Nolla borttagen",
      type: "success",
    });
  },
  addPhadder: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await api.POST("/nollning/groups/{id}/phaddrar", {
      fetch,
      params: { path: { id: form.data.groupId } },
      body: { memberId: form.data.memberId },
    });
    if (res.error)
      return setError(
        form,
        "memberId",
        res.error.detail ?? "Personen hittas inte som phadder det året",
      );
    return message(form, {
      message: "Phadder tillagd",
      type: "success",
    });
  },
  removePhadder: async ({ fetch, request }) => {
    const form = await superValidate(request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await api.DELETE("/nollning/groups/{id}/phaddrar/{memberId}", {
      fetch,
      params: { path: { id: form.data.groupId, memberId: form.data.memberId } },
    });
    if (res.error) return setError(form, "memberId", res.error.detail ?? "");
    return message(form, {
      message: "Phadder borttagen",
      type: "success",
    });
  },
};
