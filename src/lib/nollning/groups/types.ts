import type { Prisma } from "@prisma/client";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const phadderGroupSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	year: z
		.number()
		.min(1982)
		.max(new Date().getFullYear())
		.default(new Date().getFullYear()),
	imageUrl: z.string().nullable(),
});

export type PhadderGroupSchema = Infer<typeof phadderGroupSchema>;

export const phadderMandateFilter = (
	year: number,
): Prisma.MandateWhereInput => ({
	OR: [
		{
			positionId: "dsek.noll.phadder",
		},
		{
			positionId: "dsek.noll.uppdrag",
		},
	],
	startDate: {
		lte: new Date(year, 9, 1), // 1st of october is kind of end of nollning each year
	},
	endDate: {
		gte: new Date(year, 7, 1), // 1st of august is a bit before the nollning but I would say that works
	},
});
