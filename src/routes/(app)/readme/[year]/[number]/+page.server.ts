import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, params }) => {
	const prisma = locals.prisma;
	const { year, number } = params;
	const readme = await prisma.readme.findFirst({
		where: {
			year: parseInt(year),
			number: parseInt(number),
		},
	});
	if (!readme) {
		error(404, "README not found");
	}
	return { readme };
};
