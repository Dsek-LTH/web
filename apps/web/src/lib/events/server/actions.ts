import { actionType, eventSchema } from "$lib/events/schema";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { error, type Action } from "@sveltejs/kit";
import { z } from "zod";
import { fail, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { serverApi } from "$lib/server/apiClient";
import { multipart } from "$lib/api/client";
import type { components } from "$lib/api/schema";

type EventInput = components["schemas"]["EventInput"];

// Slug generation (including the sequential per-occurrence suffixing for a
// recurring series), recurring-series expansion, DST-safe wall-clock
// reconstruction, author resolution, and body sanitization all now happen
// server-side in the Go API (apps/api/internal/events) - this file just
// validates the form, uploads the image, and forwards the result.

async function uploadImage(
  api: ReturnType<typeof serverApi>,
  file: File,
): Promise<string> {
  const res = await api.POST("/images", { body: { file }, ...multipart });
  if (res.error)
    error(res.response.status, res.error.detail ?? "Failed to upload image");
  return res.data.url;
}

function toEventInput(
  data: z.infer<typeof eventSchema>,
  imageUrl: string | null,
  nollningSeasonId: string | null,
): EventInput {
  return {
    titleSv: data.titleSv,
    titleEn: data.titleEn,
    descriptionSv: data.descriptionSv,
    descriptionEn: data.descriptionEn,
    shortDescriptionSv: data.shortDescriptionSv,
    shortDescriptionEn: data.shortDescriptionEn,
    link: data.link,
    location: data.location,
    organizer: data.organizer,
    // Go overwrites organizer with the committee's name when one is set.
    committeeId: data.committeeId,
    imageUrl,
    startAt: data.startDatetime.toISOString(),
    endAt: data.endDatetime.toISOString(),
    alarmActive: data.alarmActive ?? false,
    isCancelled: data.isCancelled ?? false,
    tagIds: data.tags.filter((tag) => !!tag).map((tag) => tag.id),
    // Nollning content is written on the nollning site; a new event has no
    // season and an edited one keeps its own.
    nollningSeasonId,
    recurring: data.isRecurring
      ? {
          type: data.recurringType,
          separationCount: data.separationCount,
          endAt: data.recurringEndDatetime.toISOString(),
        }
      : undefined,
  };
}

export const createEvent: Action = async (event) => {
  const { request } = event;
  const api = serverApi(event);
  const form = await superValidate(request, zod4(eventSchema));
  if (!form.valid) return fail(400, { form });

  const imageUrl = form.data.image
    ? await uploadImage(api, form.data.image)
    : (form.data.imageUrl ?? null);

  const created = await api.POST("/events", {
    body: toEventInput(form.data, imageUrl, null),
  });
  if (created.error)
    error(
      created.response.status,
      created.error.detail ?? "Failed to create event",
    );

  throw redirect(
    `/events/${created.data.slug}`,
    {
      // No dedicated paraglide message for this exists yet - matches the
      // old code, which also hardcoded this string untranslated.
      message: "Evenemang skapat",
      type: "success",
    },
    event,
  );
};

export const updateEvent: Action<{ slug: string }> = async (event) => {
  const { request, params } = event;
  const api = serverApi(event);
  const slug = params.slug;
  const form = await superValidate(
    request,
    zod4(eventSchema.and(z.object({ editType: actionType }))),
  );
  if (!form.valid) return fail(400, { form });

  const imageUrl = form.data.image
    ? await uploadImage(api, form.data.image)
    : (form.data.imageUrl ?? null);

  const current = await api.GET("/events/{slug}", {
    params: { path: { slug }, query: { includeDeleted: true } },
  });
  if (current.error)
    error(
      current.response.status,
      current.error.detail ?? m.events_errors_eventNotFound(),
    );

  const updated = await api.PUT("/events/{slug}", {
    params: { path: { slug }, query: { scope: form.data.editType } },
    body: toEventInput(
      form.data,
      imageUrl,
      current.data.nollningSeasonId ?? null,
    ),
  });
  if (updated.error) {
    if (updated.response.status === 404) {
      return error(404, m.events_errors_eventNotFound());
    }
    error(
      updated.response.status,
      updated.error.detail ?? "Failed to update event",
    );
  }

  throw redirect(
    `/events/${updated.data.slug}`,
    {
      message: m.events_eventUpdated(),
      type: "success",
    },
    event,
  );
};
