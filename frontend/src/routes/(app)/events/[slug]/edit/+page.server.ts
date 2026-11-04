import { updateEvent } from "$lib/events/server/actions";
import type { Actions } from "./$types";

// load moved to +page.ts (universal load, calling the Go API) - see
// DESIGN.md's "every article page moves to +page.ts... including
// create/edit" decision, applied here to events too. This file is
// actions-only now.
export const actions: Actions = {
  default: updateEvent,
};
