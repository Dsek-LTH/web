import { z } from "zod";

export const createSongSchema = z.object({
  title: z.string().default(""),
  lyrics: z.string().default(""),
  melody: z.string().default(""),
  category: z.string().default(""),
});
export type CreateSongSchema = typeof createSongSchema;
