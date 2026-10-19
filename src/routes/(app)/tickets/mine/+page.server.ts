import { listMyTickets } from "$lib/server/ticketService";
import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, request }) => {
  if (!locals.member) {
    redirect(302, "/tickets");
  }

  const tickets = await listMyTickets(request);
  return { tickets };
};
