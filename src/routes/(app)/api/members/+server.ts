import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchForMembers } from "./membersSearch";

export const GET: RequestHandler = async ({ locals, url }) => {
  const { prisma, user } = locals;

  if (!user?.memberId) {
    throw error(401, "You must be logged in to search for members");
  }

  const search = url.searchParams.get("search")?.toLowerCase();

  if (search == undefined || search.length === 0) {
    throw error(400, "you need to provide a search value");
  }

  return new Response(JSON.stringify(await searchForMembers(prisma, search)));
};
