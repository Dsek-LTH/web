import { Prisma } from "@prisma/client";

export const expensesInclusion = {
	member: {
		select: {
			firstName: true,
			lastName: true,
			picturePath: true,
		},
	},
	items: {
		include: {
			signer: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					picturePath: true,
				},
			},
			signedBy: {
				select: {
					firstName: true,
					lastName: true,
					picturePath: true,
				},
			},
		},
		orderBy: {
			id: Prisma.SortOrder.desc,
		},
	},
};
