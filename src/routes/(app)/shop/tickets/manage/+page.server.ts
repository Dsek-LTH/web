import { getTickets } from "$lib/server/shop/getTickets";
import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { user, prisma } = locals;
	authorize(apiNames.WEBSHOP.MANAGE, user);

	const allTickets = await getTickets(prisma, user, true);
	return {
		tickets: allTickets,
	};
};
