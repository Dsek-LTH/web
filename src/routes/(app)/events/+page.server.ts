import type { Actions } from "./$types";
import { interestedAction } from "./interestedGoing";

export const actions: Actions = {
  interested: interestedAction(true, false),
  going: interestedAction(false, true),
  none: interestedAction(false, false),
};
