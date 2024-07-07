import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = ({ url, locals, params }) => {
  const { user, prisma } = locals;
  const yearQuery = url.searchParams.get("year");
  const parsedYear = parseInt(yearQuery ?? "");
  const year = isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;

  return committeeLoad(user, prisma, params.shortName, year);
};

export const actions = committeeActions();
