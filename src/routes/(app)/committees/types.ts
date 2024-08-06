import { type Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  darkImageUrl: z.string().optional(),
  lightImageUrl: z.string().optional(),
  monoImageUrl: z.string().optional(),
  symbolUrl: z.string().optional(),
  markdown: z.string().optional(),
  markdownSlug: z.string().optional(),
});

export type UpdateSchema = Infer<typeof updateSchema>;
