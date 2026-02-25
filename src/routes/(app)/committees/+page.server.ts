import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const { prisma } = locals;
	const committees = await prisma.committee.findMany({
		include: {
			positions: {
				select: {
					mandates: {
						where: {
							startDate: {
								lte: new Date(),
							},
							endDate: {
								gte: new Date(),
							},
						},
						select: {
							memberId: true,
						},
					},
				},
				orderBy: {
					nameSv: "asc",
				},
			},
		},
	});
	return {
		committees,
	};
};
