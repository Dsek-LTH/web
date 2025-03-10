import type { RequestHandler } from "./$types";
import {
  fetchAliasSenders,
  fetchSpecialSenders,
  mergeAliases,
  removeEmptySenders,
  stringifyAliases,
} from "../utils";

/**
 * Returns a text response where each line contains an email alias
 * followed by a list of ", " separated student IDs
 * that are allowed to send emails from that alias.
 *
 * @example
 *    GET /api/mail/alias/senders
 *
 *    Response:
 *    ```
 *    sexm@dsek.se ma6768ba-s
 *    styrelsen@dsek.se em5261ha-s, al4070an-s, le6853ha-s
 *    ```
 */
export const GET: RequestHandler = async ({ setHeaders }) => {
  const emailAliases = await fetchAliasSenders();
  const specialReceivers = await fetchSpecialSenders();
  const aliases = removeEmptySenders(
    mergeAliases([...emailAliases, ...specialReceivers]),
  );

  setHeaders({
    "Content-Type": "text/plain; charset=utf-8",
  });
  return new Response(stringifyAliases(aliases));
};
