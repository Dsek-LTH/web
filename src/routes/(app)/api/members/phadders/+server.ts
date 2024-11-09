import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchForMembers } from "../membersSearch";
import { phadderMandateFilter } from "$lib/nollning/groups/types";

// Like member search but filters on members who were phadders during the given year
export const GET: RequestHandler = async ({ locals, url }) => {
  const { prisma } = locals;
  const search = url.searchParams.get("search")?.toLowerCase();
  const year = Number.parseInt(
    url.searchParams.get("year") ?? new Date().getFullYear().toString(),
  );
  if (search == undefined || search.length === 0) {
    throw error(400, "you need to provide a search value");
  }
  if (Number.isNaN(year)) {
    throw error(400, "invalid year");
  }

  return new Response(
    JSON.stringify(
      await searchForMembers(prisma, search, {
        mandates: {
          some: phadderMandateFilter(year),
        },
      }),
    ),
  );
};
