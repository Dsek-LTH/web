import { listTicketReleases } from "$lib/server/ticketService";

export const load = async ({ request }) => {
  const releases = await listTicketReleases(request);
  return { releases };
};
