import type { PageServerLoad } from "./$types";
import { getAllArticles } from "$lib/news/getArticles";

export const load: PageServerLoad = async ({ locals }) => {
	const { prisma } = locals;
	const [articles] = await getAllArticles(prisma);
	return {
		articles,
	};
};
