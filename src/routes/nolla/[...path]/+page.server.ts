import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/**
 * This route catches all requests that
 * don't match any other /nolla routes.
 *
 * It returns a 404 error that will be
 * handled by the /nolla/+error page,
 * instead of the root +error page.
 */

export const load: PageServerLoad = async () => {
  error(404);
};
