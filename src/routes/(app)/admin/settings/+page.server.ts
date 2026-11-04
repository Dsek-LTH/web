import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

// The nollning period form edits the latest nollning season (Phase 2's
// nollning_seasons, which replaced the old nollning_start/nollning_end
// AdminSetting keys this form used to write): its start, reveal and end.
// Saving with no season yet creates one for the start date's year.
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

  const latest = latestSeason(seasonsRes.data ?? []);

  return {
    settings: settingsRes.data ?? [],
    nollning: latest
      ? {
          start: new Date(latest.nollaStartAt),
          reveal: new Date(latest.revealAt),
          end: new Date(latest.endAt),
        }
      : null,
    updateForm: await superValidate(zod4(updateSchema)),
    updateNollningForm: await superValidate(zod4(updateNollningPeriodSchema)),
  };
};

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
const removeSchema = z.object({
  key: z.string().min(1),
});
const updateNollningPeriodSchema = z.object({
  start: z.date(),
  reveal: z.date(),
  end: z.date(),
});

type Season = { id: string; year: number } & Record<string, unknown>;
const latestSeason = <T extends Season>(seasons: T[]): T | undefined =>
  seasons.reduce<T | undefined>(
    (latest, s) => (!latest || s.year > latest.year ? s : latest),
    undefined,
  );

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
  async updateNollning(event) {
    const api = serverApi(event);
    const form = await superValidate(
      event.request,
      zod4(updateNollningPeriodSchema),
    );
    if (!form.valid) return fail(400, { form });
    const seasonsRes = await api.GET("/nollning/seasons", {});
    const latest = latestSeason(seasonsRes.data ?? []);
    const body = {
      year: latest?.year ?? form.data.start.getFullYear(),
      nollaStartAt: form.data.start.toISOString(),
      revealAt: form.data.reveal.toISOString(),
      endAt: form.data.end.toISOString(),
      organizingCommitteeId: latest?.organizingCommitteeId ?? null,
    };
    const res = latest
      ? await api.PUT("/nollning/seasons/{id}", {
          params: { path: { id: latest.id } },
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
