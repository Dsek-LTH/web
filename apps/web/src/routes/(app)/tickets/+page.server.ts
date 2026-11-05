import apiNames from "$lib/utils/apiNames";
import { listTicketReleases } from "$lib/server/ticketService";

export const load = async (event) => {
  const releases = await listTicketReleases(event);
  return {
    releases,
    // Only decides whether to link the admin page - Go gates it itself.
    canAdmin: !!event.locals.user?.policies?.includes(apiNames.WEBSHOP.CREATE),
  };
};
