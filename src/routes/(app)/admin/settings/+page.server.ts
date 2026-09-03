import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

// This page's +page.svelte is still <NotImplemented /> (no real admin UI
// built yet) - the load/actions below are still ported to the Go backend
// regardless, same "port the server logic even without a page.svelte"
// precedent as committees/nollu/groups/manage (see its +page.server.ts's
// own comment) - keeps this server code correct instead of leaving it on
// the now-superseded AdminSetting-backed nollning_start/nollning_end keys.
//
// admin:settings:read/update/delete (Go's apinames.AdminSettings*) are
// enforced by Go itself now (internal/adminsettings) - no authorize() call
// here, matching DESIGN.md's Principle #5. The old update/remove actions
// had no authorize() call at all either, so this is a real fix, not a
// replicated gap - see backend/CLAUDE.md's Admin routes section.

export const load: PageServerLoad = async (event) => {
  const api = serverApi(event);
  const settingsRes = await api.GET("/admin-settings", {});
  const seasonsRes = await api.GET("/nollning/seasons", {});

  return {
    settings: settingsRes.data ?? [],
    nollningSeasons: seasonsRes.data ?? [],
    updateForm: await superValidate(zod4(updateSchema)),
    createNollningSeasonForm: await superValidate(zod4(seasonSchema)),
  };
};

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
const removeSchema = z.object({
  key: z.string().min(1),
});
const seasonSchema = z.object({
  id: z.string().uuid().optional(),
  year: z.number().int(),
  nollaStartAt: z.date(),
  revealAt: z.date(),
  endAt: z.date(),
  organizingCommitteeId: z.string().uuid().nullable().optional(),
});

export const actions = {
  async update(event) {
    const form = await superValidate(event.request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).PUT("/admin-settings/{key}", {
      params: { path: { key: form.data.key } },
      body: { value: form.data.value },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: `Inställning ${form.data.key} uppdaterad`,
      type: "success",
    });
  },
  async remove(event) {
    const form = await superValidate(event.request, zod4(removeSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).DELETE("/admin-settings/{key}", {
      params: { path: { key: form.data.key } },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: `Inställning ${form.data.key} raderad`,
      type: "success",
    });
  },
  async upsertNollningSeason(event) {
    const api = serverApi(event);
    const form = await superValidate(event.request, zod4(seasonSchema));
    if (!form.valid) return fail(400, { form });
    const body = {
      year: form.data.year,
      nollaStartAt: form.data.nollaStartAt.toISOString(),
      revealAt: form.data.revealAt.toISOString(),
      endAt: form.data.endAt.toISOString(),
      organizingCommitteeId: form.data.organizingCommitteeId ?? null,
    };
    const res = form.data.id
      ? await api.PATCH("/nollning/seasons/{id}", {
          params: { path: { id: form.data.id } },
          body,
        })
      : await api.POST("/nollning/seasons", { body });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: `Nollningsperiod uppdaterad`,
      type: "success",
    });
  },
};
