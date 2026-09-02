import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { api } from "$lib/api/client";
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

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const { prisma, user } = locals;
  authorize(apiNames.ADMIN.SETTINGS.READ, user);
  const settings = await prisma.adminSetting.findMany();

  const seasonsRes = await api.GET("/nollning/seasons", { fetch });

  return {
    settings,
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
  async update({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(updateSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.upsert({
      where: { key: form.data.key },
      update: { value: form.data.value },
      create: { key: form.data.key, value: form.data.value },
    });
    return message(form, {
      message: `Inställning ${form.data.key} uppdaterad`,
      type: "success",
    });
  },
  async remove({ locals, request }) {
    const { prisma } = locals;
    const form = await superValidate(request, zod4(removeSchema));
    if (!form.valid) return fail(400, { form });
    await prisma.adminSetting.delete({ where: { key: form.data.key } });
    return message(form, {
      message: `Inställning ${form.data.key} raderad`,
      type: "success",
    });
  },
  async upsertNollningSeason({ fetch, request }) {
    const form = await superValidate(request, zod4(seasonSchema));
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
          fetch,
          params: { path: { id: form.data.id } },
          body,
        })
      : await api.POST("/nollning/seasons", { fetch, body });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: `Nollningsperiod uppdaterad`,
      type: "success",
    });
  },
};
