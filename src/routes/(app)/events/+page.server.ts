import type { Actions } from "./$types";
import { interestedAction } from "$lib/events/server/interestedGoing";

// load moved to +page.ts (universal load, calling the Go API - see
// DESIGN.md's "every article page moves to +page.ts" decision, applied
// here to events too). This file is actions-only now.
export const actions: Actions = {
  interested: interestedAction(true, false),
  going: interestedAction(false, true),
  none: interestedAction(false, false),
};
