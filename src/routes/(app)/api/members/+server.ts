import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchForMembers } from "./membersSearch";

export const GET: RequestHandler = async ({ locals, url }) => {
  const { prisma } = locals;
  const search = url.searchParams.get("search")?.toLowerCase();

  if (search == undefined || search.length === 0) {
    error(400, "you need to provide a search value");
  }

  return new Response(JSON.stringify(await searchForMembers(prisma, search)));
};
