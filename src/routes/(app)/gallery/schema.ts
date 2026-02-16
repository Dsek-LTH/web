import { memberSchema } from "$lib/zod/schemas";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const albumSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  slug: z.string(),
  imageCount: z.number(),
  photographers: z.array(memberSchema),
  editors: z.array(memberSchema),
});
export type AlbumSchema = Infer<typeof albumSchema>;

export const albumsSchema = z.array(albumSchema);
export type AlbumsSchema = Infer<typeof albumsSchema>;
