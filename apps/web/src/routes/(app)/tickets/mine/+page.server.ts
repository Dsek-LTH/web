import { listMyTickets } from "$lib/server/ticketService";
import { redirect } from "@sveltejs/kit";

export const load = async (event) => {
  if (!event.locals.member) {
    redirect(302, "/tickets");
  }

  const tickets = await listMyTickets(event);
  return { tickets };
};
