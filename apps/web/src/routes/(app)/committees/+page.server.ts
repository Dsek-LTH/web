import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Makes /committees a route at all; +layout.ts already redirects it to the
// committee list on /about before this runs.
export const load: PageServerLoad = async () => {
  throw redirect(301, "/about#committees");
};
