import type { RequestHandler } from "./$types";
import {
  fetchAliasReceivers,
  fetchSpecialReceivers,
  addFallbackEmail,
  stringifyAliases,
  mergeAliases,
} from "./utils";

/**
 * Returns a text response where each line contains an email alias followed by
 * a list of ", " separated emails that should receive emails to that alias.
 *
 * @example
 *    GET /api/mail/alias
 *
 *    Response:
 *    ```
 *    sexm@dsek.se xenon.shadow.6768@user.dsek.se
 *    styrelsen@dsek.se jackson.maverick.4216@user.dsek.se, luna.skylark.2499@user.dsek.se
 *    ```
 */
export const GET: RequestHandler = async ({ setHeaders }) => {
  const emailAliases = await fetchAliasReceivers();
  const specialReceivers = await fetchSpecialReceivers();
  const aliases = addFallbackEmail(
    mergeAliases([...emailAliases, ...specialReceivers]),
  );

  setHeaders({
    "Content-Type": "text/plain; charset=utf-8",
  });
  return new Response(stringifyAliases(aliases));
};
