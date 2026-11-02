import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { serverApi } from "$lib/server/apiClient";
import type { RequestEvent } from "@sveltejs/kit";
import { fail, message, setError, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";

// Every rule (who may manage groups, that members exist, that a phadder
// holds a phadder/uppdrag mandate during the group's season) is Go's -
// see backend/CLAUDE.md's Nollning routes section.
//
// Groups belong to a nollning season in Go; the page (upstream #1291)
// edits them by year, so a group's year is its season's, and saving a
// year picks that year's season.

export const load = async (event) => {
  const { locals } = event;
  const api = serverApi(event);
  authorize(apiNames.NOLLNING.MANAGE_PHADDER_GROUPS, locals.user);

  const [summariesRes, seasonsRes] = await Promise.all([
    api.GET("/nollning/groups", {}),
    api.GET("/nollning/seasons", {}),
  ]);
  const seasons = seasonsRes.data ?? [];
  const yearOf = (seasonId: string) =>
    seasons.find((season) => season.id === seasonId)?.year ??
    new Date().getFullYear();

  const groups = await Promise.all(
    (summariesRes.data ?? []).map(async (summary) => {
      const detailRes = await api.GET("/nollning/groups/{id}", {
        params: { path: { id: summary.id } },
      });
      const group = detailRes.data ?? summary;
      const formData = {
        id: group.id,
        name: group.name,
        description: group.description ?? null,
        year: yearOf(group.seasonId),
        imageUrl: group.imageUrl ?? null,
      };
      return {
        ...formData,
        nollor: group.nollor ?? [],
        phaddrar: group.phaddrar ?? [],
        form: await superValidate(formData, zod4(phadderGroupSchema)),
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
  year: z
    .number()
    .min(1982)
    .max(new Date().getFullYear())
    .default(new Date().getFullYear()),
  imageUrl: z.string().nullable(),
});
const createPhadderGroupSchema = phadderGroupSchema.omit({ id: true });
const updatePhadderGroupSchema = phadderGroupSchema;
const deletePhadderGroupSchema = phadderGroupSchema.pick({ id: true });

const personSchema = z.object({
  studentId: z.string(),
  groupId: z.string().uuid(),
});

const addPersonSchema = z.object({
  studentId: z.array(z.string()).min(1),
  groupId: z.string().uuid(),
});

/** The id of the nollning season for `year`, if there is one. */
const seasonForYear = async (event: RequestEvent, year: number) => {
  const res = await serverApi(event).GET("/nollning/seasons", {});
  return (res.data ?? []).find((season) => season.year === year)?.id;
};

// Go's 400 details for a member list name what went wrong.
const NOT_PHADDER = "not a phadder that year: ";
const membersError = (detail: string | undefined) => {
  if (detail?.includes(NOT_PHADDER)) {
    return m.nollu_manage_notPhadderThatYear({
      names: detail.slice(detail.indexOf(NOT_PHADDER) + NOT_PHADDER.length),
    });
  }
  if (detail?.includes("not found")) return m.nollu_manage_membersNotFound();
  return detail ?? m.nollu_manage_groupNotFound();
};

export const actions = {
  create: async (event) => {
    const form = await superValidate(
      event.request,
      zod4(createPhadderGroupSchema),
    );
    if (!form.valid) return fail(400, { form });
    const seasonId = await seasonForYear(event, form.data.year);
    if (!seasonId) {
      return setError(form, "year", m.nollu_manage_noSeasonForYear());
    }
    const res = await serverApi(event).POST("/nollning/groups", {
      body: {
        name: form.data.name,
        description: form.data.description,
        imageUrl: form.data.imageUrl,
        seasonId,
      },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: m.nollu_manage_groupCreated(),
      type: "success",
    });
  },
  update: async (event) => {
    const form = await superValidate(
      event.request,
      zod4(updatePhadderGroupSchema),
    );
    if (!form.valid) return fail(400, { form });
    const seasonId = await seasonForYear(event, form.data.year);
    if (!seasonId) {
      return setError(form, "year", m.nollu_manage_noSeasonForYear());
    }
    const res = await serverApi(event).PATCH("/nollning/groups/{id}", {
      params: { path: { id: form.data.id } },
      body: {
        name: form.data.name,
        description: form.data.description,
        imageUrl: form.data.imageUrl,
        seasonId,
      },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: m.nollu_manage_groupUpdated(),
      type: "success",
    });
  },
  delete: async (event) => {
    const form = await superValidate(
      event.request,
      zod4(deletePhadderGroupSchema),
    );
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).DELETE("/nollning/groups/{id}", {
      params: { path: { id: form.data.id } },
    });
    if (res.error) return fail(400, { form });
    return message(form, {
      message: m.nollu_manage_groupDeleted(),
      type: "success",
    });
  },
  addNolla: async (event) => {
    const form = await superValidate(event.request, zod4(addPersonSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).POST("/nollning/groups/{id}/nollor", {
      params: { path: { id: form.data.groupId } },
      body: { studentIds: form.data.studentId },
    });
    if (res.error) return setError(form, membersError(res.error.detail));
    return message(form, {
      message: m.nollu_manage_nollaAdded(),
      type: "success",
    });
  },
  removeNolla: async (event) => {
    const form = await superValidate(event.request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).DELETE(
      "/nollning/groups/{id}/nollor/{studentId}",
      {
        params: {
          path: { id: form.data.groupId, studentId: form.data.studentId },
        },
      },
    );
    if (res.error) {
      return setError(form, "studentId", m.nollu_manage_memberNotFound());
    }
    return message(form, {
      message: m.nollu_manage_nollaRemoved(),
      type: "success",
    });
  },
  addPhadder: async (event) => {
    const form = await superValidate(event.request, zod4(addPersonSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).POST("/nollning/groups/{id}/phaddrar", {
      params: { path: { id: form.data.groupId } },
      body: { studentIds: form.data.studentId },
    });
    if (res.error) return setError(form, membersError(res.error.detail));
    return message(form, {
      message: m.nollu_manage_phadderAdded(),
      type: "success",
    });
  },
  removePhadder: async (event) => {
    const form = await superValidate(event.request, zod4(personSchema));
    if (!form.valid) return fail(400, { form });
    const res = await serverApi(event).DELETE(
      "/nollning/groups/{id}/phaddrar/{studentId}",
      {
        params: {
          path: { id: form.data.groupId, studentId: form.data.studentId },
        },
      },
    );
    if (res.error) {
      return setError(form, "studentId", m.nollu_manage_memberNotFound());
    }
    return message(form, {
      message: m.nollu_manage_phadderRemoved(),
      type: "success",
    });
  },
};
