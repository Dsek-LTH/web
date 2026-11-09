import apiNames from "$lib/utils/apiNames";
import { isAuthorized } from "$lib/utils/authorization";
import { listTicketReleases } from "$lib/server/ticketService";

export const load = async ({ locals, request }) => {
  const releases = await listTicketReleases(request);
  return {
    releases,
    // Same permission the admin release list requires.
    canAdmin: isAuthorized(apiNames.WEBSHOP.CREATE, locals.user),
  };
};
