import { z } from "zod";

export const SongDto = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    lyrics: z.string(),
    melody: z.string().nullable(),
    category: z.string().nullable(),
    video: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    deletedAt: z.string().nullable(),
  })
  .meta({ id: "Song" });

export const SongSlugInput = z
  .object({
    slug: z.string().min(1),
  })
  .meta({ id: "SongSlugInput" });

export const CreateSongInput = z
  .object({
    title: z.string().min(1),
    lyrics: z.string().min(1),
    melody: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    video: z.string().nullable().optional(),
  })
  .meta({ id: "CreateSongInput" });

export const UpdateSongInput = z
  .object({
    title: z.string().min(1).optional(),
    lyrics: z.string().min(1).optional(),
    melody: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    video: z.string().nullable().optional(),
  })
  .meta({ id: "UpdateSongInput" });

// `category` may be repeated in the query string (`?category=a&category=b`);
// the endpoint() query merger turns repeats into an array and a single
// occurrence into a bare string, so both shapes have to be accepted here.
export const ListSongsInput = z
  .object({
    search: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    showDeleted: z.coerce.boolean().optional(),
  })
  .meta({ id: "ListSongsInput" });

export const ListSongsOutput = z
  .object({
    songs: z.array(SongDto),
    page: z.number(),
    pageCount: z.number(),
    totalCount: z.number(),
  })
  .meta({ id: "SongList" });

export const CategoriesOutput = z.array(z.string()).meta({ id: "SongCategories" });
export const MelodiesOutput = z.array(z.string()).meta({ id: "SongMelodies" });
