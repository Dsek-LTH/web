import { getAllEvents } from "$lib/events/getEvents";
import { interestedGoingSchema } from "$lib/events/schema";
import * as m from "$paraglide/messages";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import type { LayoutServerLoad } from "./$types";
import { getAllTags } from "$lib/news/tags";

const getAndValidatePage = (url: URL) => {
  const page = url.searchParams.get("page");
  if (page && Number.isNaN(Number.parseInt(page))) {
    throw new Error(m.events_errors_invalidPage());
  }
  return page ? Math.max(Number.parseInt(page) - 1, 0) : undefined;
};

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { prisma } = locals;
  const [[events, pageCount], allTags] = await Promise.all([
    getAllEvents(prisma, {
      tags: url.searchParams.getAll("tags"),
      search: url.searchParams.get("search") ?? undefined,
      page: getAndValidatePage(url),
      pastEvents: url.searchParams.get("past") === "on",
    }),
    getAllTags(prisma),
  ]);
  return {
    events,
    pageCount,
    allTags,
    interestedGoingForm: await superValidate(zod(interestedGoingSchema)),
  };
};
