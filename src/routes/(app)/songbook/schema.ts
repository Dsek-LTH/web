import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const createSongSchema = z.object({
  title: z.string().default(""),
  lyrics: z.string().default(""),
  melody: z.string().default(""),
  category: z.string().default(""),
});

export type CreateSongSchema = Infer<typeof createSongSchema>;

export const updateSongSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  lyrics: z.string().optional(),
  melody: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export type UpdateSongSchema = Infer<typeof updateSongSchema>;
