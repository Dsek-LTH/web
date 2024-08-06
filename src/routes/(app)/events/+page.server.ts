import type { Actions } from "./$types";
import { interestedAction } from "$lib/events/server/interestedGoing";

export const actions: Actions = {
  interested: interestedAction(true, false),
  going: interestedAction(false, true),
  none: interestedAction(false, false),
};
