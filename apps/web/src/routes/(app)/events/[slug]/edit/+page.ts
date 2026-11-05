import { getEventCommitteeOptions } from "$lib/events/committees";
import { actionType, eventSchema } from "$lib/events/schema";
import { api } from "$lib/api/client";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageLoad } from "./$types";
import { requireCanEdit } from "$lib/utils/access";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const [eventRes, tagsRes, committees] = await Promise.all([
    api.GET("/events/{slug}", {
      fetch,
      params: { path: { slug: params.slug }, query: { includeDeleted: true } },
    }),
    api.GET("/tags", { fetch }),
    getEventCommitteeOptions(fetch),
  ]);
  if (eventRes.error) throw error(404, m.events_errors_eventNotFound());
  const event = eventRes.data;
  requireCanEdit((await parent()).user, event.canEdit);

  // Go's EventDetail.recurring carries the series' own settings, so a
  // FUTURE/ALL edit shows them instead of the form defaults.
  const isRecurring = event.recurringParentId != null;
  const series = event.recurring;

  return {
    allTags: tagsRes.data ?? [],
    committees,
    event,
    recurringParentId: event.recurringParentId ?? null,
    form: await superValidate(
      {
        titleSv: event.titleSv,
        titleEn: event.titleEn ?? null,
        descriptionSv: event.descriptionSv,
        descriptionEn: event.descriptionEn ?? null,
        shortDescriptionSv: event.shortDescriptionSv ?? null,
        shortDescriptionEn: event.shortDescriptionEn ?? null,
        link: event.link ?? null,
        location: event.location ?? null,
        organizer: event.organizer,
        committeeId: event.committeeId ?? null,
        startDatetime: new Date(event.startAt),
        endDatetime: new Date(event.endAt),
        imageUrl: event.imageUrl ?? null,
        tags: (event.tags ?? []).map((tag) => ({ id: tag.id })),
        alarmActive: event.alarmActive,
        isCancelled: event.isCancelled,
        isRecurring,
        ...(series
          ? {
              recurringType: series.type as z.infer<
                typeof eventSchema
              >["recurringType"],
              separationCount: series.separationCount,
              recurringEndDatetime: new Date(series.endAt),
            }
          : {}),
        editType: "THIS" as const,
      },
      zod4(eventSchema.and(z.object({ editType: actionType }))),
    ),
    // From Go (EventDetail.canDelete) - see the event detail page's
    // +page.ts.
    canDelete: event.canDelete,
  };
};
