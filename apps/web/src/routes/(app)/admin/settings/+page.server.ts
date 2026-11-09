import { serverApi } from "$lib/server/apiClient";
import { fail } from "@sveltejs/kit";
import type { ErrorStatus } from "sveltekit-superforms";
import dayjs from "dayjs";
import { APP_TIMEZONE, toAppTime } from "$lib/utils/datetime";
import * as m from "$paraglide/messages";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import type { PageServerLoad } from "./$types";
import { requirePolicy } from "$lib/utils/access";
import apiNames from "$lib/utils/apiNames";

// The nollning seasons (which replaced the old nollning_start/nollning_end
// AdminSetting keys): the current and coming ones to edit, the ended ones
// behind a fold, and a form for a new one.
//
// admin:settings:read/update/delete (Go's apinames.AdminSettings*) are
// enforced by Go itself now (internal/adminsettings) - no authorize() call
// here. The old update/remove actions had no authorize() call at all
// either, so Go's check is a real fix, not a replicated gap.

export const load: PageServerLoad = async (event) => {
  requirePolicy(
    event.locals.user,
    apiNames.ADMIN.SETTINGS.UPDATE,
    apiNames.NOLLNING.MANAGE_SEASONS,
  );
  const api = serverApi(event);
  const [settingsRes, seasonsRes] = await Promise.all([
    api.GET("/admin-settings", {}),
    api.GET("/nollning/seasons", {}),
  ]);

  return {
    // Empty for someone who only manages nollning seasons.
    settings: settingsRes.data ?? [],
    // Newest first, with times as the inputs show them: Swedish local time.
    seasons: (seasonsRes.data ?? []).map((season) => ({
      id: season.id,
      year: season.year,
      nollaStartAt: toLocalInput(season.nollaStartAt),
      revealAt: toLocalInput(season.revealAt),
      endAt: toLocalInput(season.endAt),
      organizingCommitteeId: season.organizingCommitteeId ?? "",
      ended: dayjs(season.endAt).isBefore(dayjs()),
    })),
    updateForm: await superValidate(zod4(updateSchema)),
  };
};

// A datetime-local input's value, in Swedish time.
const toLocalInput = (instant: string) =>
  toAppTime(instant).format("YYYY-MM-DDTHH:mm");
const fromLocalInput = (value: string) =>
  dayjs.tz(value, APP_TIMEZONE).toISOString();

const updateSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});
const removeSchema = z.object({
  key: z.string().min(1),
});
const seasonSchema = z.object({
  id: z.string().optional(),
  year: z.number().int(),
  nollaStartAt: z.string().min(1),
  revealAt: z.string().min(1),
  endAt: z.string().min(1),
  organizingCommitteeId: z.string().optional(),
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
  // Creates a season (no id) or replaces one.
  async saveSeason(event) {
    const form = await superValidate(event.request, zod4(seasonSchema));
    if (!form.valid) return fail(400, { form });
    const { id, year, nollaStartAt, revealAt, endAt, organizingCommitteeId } =
      form.data;
    const body = {
      year,
      nollaStartAt: fromLocalInput(nollaStartAt),
      revealAt: fromLocalInput(revealAt),
      endAt: fromLocalInput(endAt),
      // Unset on create means the nollu committee; an edit sends the
      // season's own.
      organizingCommitteeId: organizingCommitteeId || null,
    };
    const api = serverApi(event);
    const res = id
      ? await api.PUT("/nollning/seasons/{id}", {
          params: { path: { id } },
          body,
        })
      : await api.POST("/nollning/seasons", { body });
    if (res.error)
      return message(
        form,
        { message: res.error.detail ?? res.response.statusText, type: "error" },
        { status: res.response.status as ErrorStatus },
      );
    return message(form, {
      message: id
        ? m.admin_settings_nollningSeasonSaved({ year })
        : m.admin_settings_nollningSeasonCreated({ year }),
      type: "success",
    });
  },
};
