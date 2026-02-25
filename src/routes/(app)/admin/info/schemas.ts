import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const infoPageSchema = z.object({
	name: z.string(),
	markdownSv: z.string(),
	markdownEn: z.string(),
});
export type InfoPageSchema = Infer<typeof infoPageSchema>;
