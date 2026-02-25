import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;
	const { prisma } = locals;

	try {
		// Fetch the event by slug
		const event = await prisma.event.findUnique({
			where: { slug },
			select: {
				id: true,
				title: true,
				titleEn: true,
				description: true,
				descriptionEn: true,
				slug: true,
				location: true,
				startDatetime: true,
				endDatetime: true,
				imageUrl: true,
			},
		});

		if (!event) {
			throw error(404, `Event with slug "${slug}" not found`);
		}

		return {
			event,
		};
	} catch (e) {
		console.error("Error fetching event:", e);
		throw error(500, "Failed to load event details");
	}
};
