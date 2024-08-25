import type { Actions } from "./$types";
import { interestedAction } from "$lib/events/server/interestedGoing";
import eventPageLoad from "./EventPageLoad";

export const load = eventPageLoad();
export const actions: Actions = {
  interested: interestedAction(true, false),
  going: interestedAction(false, true),
  none: interestedAction(false, false),
};
