import type { PageServerLoad } from "./$types";
import { committeeActions, committeeLoad } from "../committee.server";

export const load: PageServerLoad = ({ params }) =>
  committeeLoad(params.shortName);

export const actions = committeeActions();
