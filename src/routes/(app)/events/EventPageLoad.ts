import { getEvents, type EventSpan } from "$lib/events/getEvents";
import { interestedGoingSchema } from "$lib/events/schema";
import { getAllTags } from "$lib/news/tags";
import {
  getPageOrThrowSvelteError,
  getPageSizeOrThrowSvelteError,
} from "$lib/utils/url.server";
import type { ServerLoadEvent } from "@sveltejs/kit";
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
    const eventCount = await prisma.event.count();

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
      const page = getPageOrThrowSvelteError(url, {
        upperBound: Math.ceil(eventCount / pageSize),
      });

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
