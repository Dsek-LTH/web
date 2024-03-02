import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = ({ locals, params }) =>
  committeeLoad(locals.prisma, params.shortName);

export const actions = committeeActions();
