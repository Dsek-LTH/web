import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getTicket } from "$lib/server/shop/getTickets";
import * as m from "$paraglide/messages";

export const load: PageServerLoad = async ({ locals, params, depends }) => {
	const { prisma, user } = locals;
	depends("tickets");
	const ticket = await getTicket(prisma, params.slug, user);
	if (!ticket) error(404, m.tickets_errors_ticketNotFound());
	return { ticket };
};
