import { actionType, eventSchema } from "$lib/events/schema";
import { api } from "$lib/api/client";
import * as m from "$paraglide/messages";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, params }) => {
  const [eventRes, tagsRes] = await Promise.all([
    api.GET("/events/{slug}", {
      fetch,
      params: { path: { slug: params.slug }, query: { status: "any" } },
    }),
    api.GET("/tags", { fetch }),
  ]);
  if (eventRes.error) throw error(404, m.events_errors_eventNotFound());
  const event = eventRes.data;

  // Go's EventDetail doesn't expose the recurring series' own settings
  // (type/separationCount/end date) - only recurringParentId, which is
  // enough to know an event is part of a series but not to re-derive what
  // that series' settings were. A FUTURE/ALL edit here would silently
  // reset separationCount to 0 and recurringType to the form default
  // rather than actually prefilling them. No Go endpoint exists to fetch
  // that yet (internal/db/queries/events.sql's GetRecurringEvent query
  // isn't wired to any route) - left as a known gap since nothing renders
  // this edit page yet either. Revisit together once a real edit UI ships.
  const isRecurring = event.recurringParentId != null;

  return {
    allTags: tagsRes.data ?? [],
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
        startDatetime: new Date(event.startAt),
        endDatetime: new Date(event.endAt),
        imageUrl: event.imageUrl ?? null,
        tags: (event.tags ?? []).map((tag) => ({ id: tag.id })),
        alarmActive: event.alarmActive,
        isCancelled: event.isCancelled,
        isRecurring,
        editType: "THIS" as const,
      },
      zod4(eventSchema.and(z.object({ editType: actionType }))),
    ),
    // From Go (EventDetail.canDelete) - see the event detail page's
    // +page.server.ts and DESIGN.md's "Principles going forward" #5.
    canDelete: event.canDelete,
  };
};
