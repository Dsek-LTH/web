import { getAllEvents } from "$lib/events/getEvents";
import { interestedGoingSchema } from "$lib/events/schema";
import { getAllTags } from "$lib/news/tags";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";
import type { ServerLoadEvent } from "@sveltejs/kit";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";

const eventPageLoad =
  (adminMode = false) => async ({ locals, url }: ServerLoadEvent) => {
    const { prisma } = locals;
    const eventCount = await prisma.event.count();
    const pageSize = getPageSizeOrThrowSvelteError(url);
    const page = getPageOrThrowSvelteError(url, {
      fallbackValue: 1,
      lowerBound: 1,
      upperBound: Math.ceil(eventCount / pageSize),
    });
    const [[events, pageCount], allTags] = await Promise.all([
      getAllEvents(
        prisma,
        {
          tags: url.searchParams.getAll("tags"),
          search: url.searchParams.get("search") ?? undefined,
          page,
          pageSize,
          pastEvents: url.searchParams.get("past") === "on",
        },
        !adminMode,
      ),
      getAllTags(prisma, adminMode),
    ]);
    return {
      events,
      pageCount,
      allTags,
      interestedGoingForm: await superValidate(zod(interestedGoingSchema)),
    };
  };

export type EventPageLoadData = Awaited<
  ReturnType<ReturnType<typeof eventPageLoad>>
>;

export default eventPageLoad;
