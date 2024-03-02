import { superValidate } from "sveltekit-superforms/server";
import type { LayoutServerLoad } from "./$types";
import { getAllEvents } from "./events";
import { interestedGoingSchema } from "./interestedGoing";

const getAndValidatePage = (url: URL) => {
  const page = url.searchParams.get("page");
  if (page && Number.isNaN(Number.parseInt(page))) {
    throw new Error("Invalid page");
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
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    events,
    pageCount,
    allTags,
    interestedGoingForm: await superValidate(interestedGoingSchema),
  };
};
