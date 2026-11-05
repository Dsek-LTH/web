import apiNames from "$lib/utils/apiNames";
import { listTicketReleases } from "$lib/server/ticketService";

// Listing expired releases requires webshop:create in Go.
export const load = async (event) => {
  const releases = await listTicketReleases(event, { includeExpired: true });

  // The release pages need WEBSHOP.MANAGE, which CREATE doesn't imply.
  const canManage = !!event.locals.user?.policies?.includes(
    apiNames.WEBSHOP.MANAGE,
  );

  return { releases, canManage };
};
