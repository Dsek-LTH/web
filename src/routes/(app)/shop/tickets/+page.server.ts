import { countUserShopItems } from "$lib/server/shop/countUserShopItems";
import { getTickets } from "$lib/server/shop/getTickets";
import { ticketPageActions } from "$lib/server/shop/tickets/actions";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, depends }) => {
	const { user, prisma } = locals;

	depends("tickets");
	const allTickets = await getTickets(prisma, user);
	if (locals.isApp && user.memberId) {
		const shopItemCounts = countUserShopItems(prisma, user);
		return {
			shopItemCounts,
			tickets: allTickets,
		};
	}

	return {
		tickets: allTickets,
	};
};

export const actions = ticketPageActions();
