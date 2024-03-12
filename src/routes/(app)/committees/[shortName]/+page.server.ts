import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = (request) => {
  const yearQuery = request.url.searchParams.get("year");
  const parsedYear = parseInt(yearQuery ?? "");
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

  return committeeLoad(request.locals.prisma, request.params.shortName, year);
};

export const actions = committeeActions();
