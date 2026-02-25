import { getMyGroupedNotifications } from "$lib/utils/notifications/myNotifications";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
	const { user, prisma } = locals;
	const groupedNotifications = getMyGroupedNotifications(user, prisma);
	return new Response(JSON.stringify(groupedNotifications));
};
