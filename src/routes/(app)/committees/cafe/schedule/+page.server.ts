import type { PageServerLoad, Actions } from "./$types";
import { scheduleActions, scheduleLoad } from "./schedule.server";

export const load: PageServerLoad = async (event) => {
  return { ...(await scheduleLoad(event)) };
};

export const actions: Actions = {
  ...scheduleActions(),
};
