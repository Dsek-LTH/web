import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { prisma, user } = locals;
	authorize(apiNames.DOOR.READ, user);

	const doors = await prisma.door.findMany();
	return {
		doors,
	};
};
