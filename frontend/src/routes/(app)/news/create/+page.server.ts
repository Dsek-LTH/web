import { createArticle } from "$lib/news/server/actions";
import type { Actions } from "./$types";

// No SvelteKit-side authorize() gate here - the Go API enforces this
// itself (currently via mock auth that always succeeds) - see
// backend/CLAUDE.md's Auth section.
export const actions: Actions = {
  default: createArticle,
};
