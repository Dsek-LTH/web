import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = ({ url, locals, params }) => {
  return committeeLoad(locals.prisma, params.shortName, url);
};

export const actions = committeeActions();
