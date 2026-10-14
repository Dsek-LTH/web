import { error, type NumericRange } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import * as m from "$paraglide/messages";

const DCOMPASSEN_URL =
  "https://files.dsek.se/files/public/miscellaneous/Dcompassen2026.html";

export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.memberId) {
    error(401, m.members_errors_notLoggedIn());
  }

  // Use the global fetch, since SvelteKit's fetch would forward the user's
  // cookies to files.dsek.se
  const fetchResponse = await fetch(DCOMPASSEN_URL);
  if (!fetchResponse.ok) {
    throw error(
      fetchResponse.status as NumericRange<400, 599>,
      fetchResponse.statusText,
    );
  }

  return new Response(fetchResponse.body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      // The HTML comes from a file bucket, so give it an opaque origin to keep
      // its scripts from acting as the signed-in user on our domain
      "Content-Security-Policy": "sandbox allow-scripts allow-popups",
    },
  });
};
