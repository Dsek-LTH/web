import apiNames from "$lib/utils/apiNames";
import { authorize, isAuthorized } from "$lib/utils/authorization";
import { listTicketReleases } from "$lib/server/ticketService";

export const load = async ({ locals, request }) => {
  const { user } = locals;
  authorize(apiNames.WEBSHOP.CREATE, user);

  const releases = await listTicketReleases(request, { includeExpired: true });

  // The release pages need WEBSHOP.MANAGE, which CREATE doesn't imply.
  const canManage = isAuthorized(apiNames.WEBSHOP.MANAGE, user);

  return { releases, canManage };
};
