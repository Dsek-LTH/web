import { createEvent } from "$lib/events/server/actions";
import type { Actions } from "./$types";

// The load is in +page.ts (a universal load calling the Go API); this
// file is actions-only.
export const actions: Actions = {
  default: createEvent,
};
