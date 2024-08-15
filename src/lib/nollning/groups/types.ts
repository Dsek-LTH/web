import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const phadderGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  year: z.number().min(1982).max(new Date().getFullYear()),
  imageUrl: z.string().nullable(),
});

export type PhadderGroupSchema = Infer<typeof phadderGroupSchema>;
