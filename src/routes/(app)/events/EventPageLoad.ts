import { api } from "$lib/api/client";
import { getMonthRange } from "$lib/events/monthCalendar";
import { APP_TIMEZONE, appDayStart } from "$lib/utils/datetime";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url";
import * as m from "$paraglide/messages";
import { error, type LoadEvent } from "@sveltejs/kit";
import dayjs from "dayjs";
import { z } from "zod";

const displaySchema = z.enum(["week", "month", "upcoming", "past"]);
export type Display = z.infer<typeof displaySchema>;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

// The week/month views list every event in the window, unpaginated - this
// is just a ceiling well above anything a single week or month holds.
const RANGE_PAGE_SIZE = 500;

/**
 * Universal load shared by /events and the admin /events/all-events page
 * (`adminMode`, which also lists soft-removed events - Go gates that on
 * event:update itself). The `tags` search param holds tag *names* (see
 * EventFilters.svelte), matched against either language here and sent to
 * Go as ids.
 */
const eventPageLoad =
  (adminMode = false) =>
  async ({ fetch, url }: Pick<LoadEvent, "fetch" | "url">) => {
    const display = displaySchema.parse(
      url.searchParams.get("display") ?? "month",
    );

    const requestedMonth = monthSchema.safeParse(url.searchParams.get("month"));
    const monthKey = requestedMonth.success
      ? requestedMonth.data
      : dayjs().tz(APP_TIMEZONE).format("YYYY-MM");

    const tagsRes = await api.GET("/tags", { fetch });
    const allTags = tagsRes.data ?? [];
    const tagNames = url.searchParams
      .getAll("tags")
      .map((name) => name.toLowerCase());
    const tagIds = allTags
      .filter((tag) =>
        [tag.nameSv, tag.nameEn].some(
          (name) => name && tagNames.includes(name.toLowerCase()),
        ),
      )
      .map((tag) => tag.id);

    let window: {
      span: "upcoming" | "past" | "range";
      from?: string;
      to?: string;
      page: number;
      pageSize: number;
    };
    if (display === "week") {
      // Today and the six days after it, as calendar days in the app's
      // timezone rather than the server's or browser's.
      const todayKey = dayjs().tz(APP_TIMEZONE).format("YYYY-MM-DD");
      const endKey = dayjs.utc(todayKey).add(7, "day").format("YYYY-MM-DD");
      window = {
        span: "range",
        from: appDayStart(todayKey).toISOString(),
        to: appDayStart(endKey).toISOString(),
        page: 1,
        pageSize: RANGE_PAGE_SIZE,
      };
    } else if (display === "month") {
      // The whole weeks the month grid shows, not just the month itself.
      const { startingAt, endingAt } = getMonthRange(monthKey);
      window = {
        span: "range",
        from: startingAt.toISOString(),
        to: endingAt.toISOString(),
        page: 1,
        pageSize: RANGE_PAGE_SIZE,
      };
    } else {
      window = {
        span: display,
        // The upper bound depends on the search/tag filters, so it is
        // checked against the filtered page count once the events have
        // been fetched.
        page: getPageOrThrowSvelteError(url),
        pageSize: getPageSizeOrThrowSvelteError(url),
      };
    }

    // A tag filter that matched no known tag can't match any event either.
    const unknownTagsOnly = tagNames.length > 0 && tagIds.length === 0;
    const eventsRes = unknownTagsOnly
      ? null
      : await api.GET("/events", {
          fetch,
          params: {
            query: {
              ...window,
              search: url.searchParams.get("search") || undefined,
              tags: tagIds,
              includeRemoved: adminMode,
            },
          },
        });
    if (eventsRes?.error) {
      error(eventsRes.response.status === 403 ? 403 : 500, {
        message: m.events_errors_eventNotFound(),
      });
    }
    const events = eventsRes?.data.events ?? [];
    const pageCount = eventsRes?.data.pageCount ?? 0;

    if (window.span !== "range" && window.page > Math.max(pageCount, 1)) {
      error(400, m.events_errors_invalidPage());
    }

    return {
      events,
      pageCount,
      allTags,
      display,
      month: monthKey,
    };
  };

export type EventPageLoadData = Awaited<
  ReturnType<ReturnType<typeof eventPageLoad>>
>;

export default eventPageLoad;
