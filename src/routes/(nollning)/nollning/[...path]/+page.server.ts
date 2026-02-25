import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

/**
 * This route catches all requests that
 * don't match any other routes.
 *
 * It returns a 404 error that will be
 * handled by the local +error page,
 * instead of the root +error page.
 */

export const load: PageServerLoad = async ({ url }) => {
	error(404, `${url.pathname} not found`);
};
