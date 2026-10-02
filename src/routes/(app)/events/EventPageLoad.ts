import { getEvents, type EventSpan } from "$lib/events/getEvents";
import { interestedGoingSchema } from "$lib/events/schema";
import { getAllTags } from "$lib/news/tags";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";
import * as m from "$paraglide/messages";
import { error, type ServerLoadEvent } from "@sveltejs/kit";
import dayjs from "dayjs";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const displaySchema = z.enum(["week", "month", "upcoming", "past"]);
export type Display = z.infer<typeof displaySchema>;

const eventPageLoad =
  (adminMode = false) =>
  async ({ locals, url }: ServerLoadEvent) => {
    const { prisma } = locals;

    const display = displaySchema.parse(
      url.searchParams.get("display") ?? "week",
    );

    let spanFilter: EventSpan;

    if (display === "week") {
      spanFilter = { weekStartingAt: dayjs().startOf("week").toDate() };
    } else if (display === "month") {
      spanFilter = { monthStartingAt: dayjs().startOf("month").toDate() };
    } else {
      const pageSize = getPageSizeOrThrowSvelteError(url);
      // The upper bound depends on the search/tag filters, so it is checked
      // against the filtered page count once the events have been fetched.
      const page = getPageOrThrowSvelteError(url);

      spanFilter = {
        span: display,
        pageSize,
        page,
      };
    }

    const [[events, pageCount], allTags] = await Promise.all([
      getEvents(
        prisma,
        {
          tags: url.searchParams.getAll("tags"),
          search: url.searchParams.get("search") ?? undefined,
          ...spanFilter,
        },
        !adminMode,
      ),
      getAllTags(prisma, adminMode),
    ]);

    if ("page" in spanFilter && spanFilter.page > Math.max(pageCount, 1)) {
      error(400, m.events_errors_invalidPage());
    }

    return {
      events,
      pageCount,
      allTags,
      display,
      interestedGoingForm: await superValidate(zod4(interestedGoingSchema)),
    };
  };

export type EventPageLoadData = Awaited<
  ReturnType<ReturnType<typeof eventPageLoad>>
>;

export default eventPageLoad;
