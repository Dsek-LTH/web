import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import { listTicketReleases } from "$lib/server/ticketService";

export const load = async ({ locals, request }) => {
  const { user } = locals;
  authorize(apiNames.WEBSHOP.CREATE, user);

  const releases = await listTicketReleases(request, { includeExpired: true });

  return { releases };
};
