import { error } from "@sveltejs/kit";
import { api } from "$lib/api/client";
import { interestedGoingSchema } from "$lib/events/schema";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { PageLoad } from "./$types";

function intParam(
  url: URL,
  name: string,
  fallback: number,
  lowerBound: number,
): number {
  const raw = url.searchParams.get(name);
  const value = raw === null ? fallback : parseInt(raw);
  if (isNaN(value) || value < lowerBound) {
    throw error(400, `Invalid ${name}`);
  }
  return value;
}

export const load: PageLoad = async ({ fetch, url }) => {
  const pageSize = intParam(url, "pageSize", 10, 1);
  const page = intParam(url, "page", 1, 1);

  const [eventsRes, tagsRes] = await Promise.all([
    api.GET("/events", {
      fetch,
      params: {
        query: {
          search: url.searchParams.get("search") ?? undefined,
          tags: url.searchParams.getAll("tags"),
          past: url.searchParams.get("past") === "on",
          page,
          pageSize,
        },
      },
    }),
    // Includes nollning-prefixed tags, unlike the old Prisma-backed
    // getAllTags(prisma, false) call this replaces - same accepted trade
    // articles' news list already made (see DESIGN.md's mocking
    // principle); the Go API doesn't know about nollning at all.
    api.GET("/tags", { fetch }),
  ]);
  if (eventsRes.error) throw error(500, "Failed to load events");
  const { events, pageCount } = eventsRes.data;

  if (pageCount > 0 && page > pageCount) {
    throw error(400, "Invalid page");
  }

  return {
    events: events ?? [],
    pageCount,
    allTags: tagsRes.data ?? [],
    interestedGoingForm: await superValidate(zod4(interestedGoingSchema)),
  };
};
