export const load = async ({ locals }) => {
	const { prisma } = locals;
	const phadderGroups = await prisma.phadderGroup.findMany({
		where: {
			year: 2025,
		},
		include: {
			nollor: true,
			phaddrar: {
				include: {
					member: true,
				},
			},
		},
		orderBy: {
			createdAt: "asc",
		},
	});
	return {
		phadderGroups,
	};
};
