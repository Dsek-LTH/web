import eventPageLoad from "../EventPageLoad";
import type { PageLoad } from "./$types";

// Lists soft-removed events too - Go itself requires event:update for
// that (includeDeleted), so there's no SvelteKit-side authorize() here.
export const load: PageLoad = eventPageLoad(true);
