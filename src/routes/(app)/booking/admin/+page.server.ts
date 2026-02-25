import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";
import { actions, getUpcomingBookingRequests } from "../utils";

export const load: PageServerLoad = async ({ locals }) => {
	const { prisma, user } = locals;
	authorize(apiNames.BOOKINGS.UPDATE, user);

	const bookingRequests = await getUpcomingBookingRequests(prisma);

	return { bookingRequests };
};

export { actions };
