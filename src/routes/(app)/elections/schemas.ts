import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const electionSchema = z.object({
  markdown: z.string(),
  markdownEn: z.string().nullable(),
  link: z.string(),
  expiresAt: z.string().date(),
  committeeId: z.string().uuid(),
});
export type ElectionSchema = Infer<typeof electionSchema>;
