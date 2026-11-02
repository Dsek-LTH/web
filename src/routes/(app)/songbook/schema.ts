import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const createSongBookEntrySchema = z.object({
  songId: z.uuid(),
  page: z.int().positive(),
  numberOnPage: z.int().positive().default(1),
});

export type CreateSongSchema = Infer<typeof createSongBookEntrySchema>;

export const updateSongBookEntrySchema = z.object({
  songId: z.uuid(),
  page: z.int().positive(),
  numberOnPage: z.int().positive(),
});

export type UpdateSongSchema = Infer<typeof updateSongBookEntrySchema>;
