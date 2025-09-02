import type { Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  darkImageUrl: z.string().nullable(),
  lightImageUrl: z.string().nullable(),
  monoImageUrl: z.string().nullable(),
  symbolUrl: z.string().nullable(),
  markdown: z.string().optional(),
  markdownEn: z.string().optional().nullable(),
  markdownSlug: z.string().optional(),
});

export type UpdateSchema = Infer<typeof updateSchema>;
