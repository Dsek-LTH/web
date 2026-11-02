import { getEvents, type EventSpan } from "$lib/events/getEvents";
import { getMonthRange } from "$lib/events/monthCalendar";
import { APP_TIMEZONE } from "$lib/utils/datetime";
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

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const eventPageLoad =
  (adminMode = false) =>
  async ({ locals, url }: ServerLoadEvent) => {
    const { prisma } = locals;

    const display = displaySchema.parse(
      url.searchParams.get("display") ?? "week",
    );

    const requestedMonth = monthSchema.safeParse(url.searchParams.get("month"));
    const monthKey = requestedMonth.success
      ? requestedMonth.data
      : dayjs().tz(APP_TIMEZONE).format("YYYY-MM");

    let spanFilter: EventSpan;

    if (display === "week") {
      // Keep the week view's existing server-local window unchanged for now.
      const start = dayjs().startOf("day");
      spanFilter = {
        startingAt: start.toDate(),
        endingAt: start.add(1, "week").toDate(),
      };
    } else if (display === "month") {
      const { startingAt, endingAt } = getMonthRange(monthKey);
      spanFilter = { startingAt, endingAt };
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
      month: monthKey,
      interestedGoingForm: await superValidate(zod4(interestedGoingSchema)),
    };
  };

export type EventPageLoadData = Awaited<
  ReturnType<ReturnType<typeof eventPageLoad>>
>;

export default eventPageLoad;
