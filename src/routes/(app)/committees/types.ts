import type { Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const updateSchema = z.object({
	nameSv: z.string().optional(),
	nameEn: z.string().nullable().optional(),
	descriptionSv: z.string().nullable(),
	descriptionEn: z.string().nullable(),
	darkImageUrl: z.string().nullable(),
	lightImageUrl: z.string().nullable(),
	monoImageUrl: z.string().nullable(),
	symbolUrl: z.string().nullable(),
	markdownSv: z.string().optional(),
	markdownEn: z.string().optional().nullable(),
	markdownSlug: z.string().optional(),
});

export type UpdateSchema = Infer<typeof updateSchema>;
