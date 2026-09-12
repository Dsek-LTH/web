import DOMPurify from "isomorphic-dompurify";
import apiNames from "$lib/utils/apiNames";
import { NotFoundError } from "$lib/server/api/errors";
import * as queries from "./queries";
import type { SongRow } from "./queries";
import { fixSongText, toSongDto } from "./convert";
import type { z } from "zod";
import type { SongDto } from "./dto";

const PAGE_SIZE = 20;

function canSeeDeleted(locals: App.Locals): boolean {
  return locals.user?.policies.includes(apiNames.SONG.DELETE) ?? false;
}

async function fetchSong(locals: App.Locals, slug: string): Promise<SongRow> {
  const song = await queries.findBySlug(locals.prisma, slug);
  if (!song) throw new NotFoundError(`No song with slug "${slug}"`);
  return song;
}

export async function list(
  locals: App.Locals,
  input: {
    search?: string;
    category?: string | string[];
    page?: number;
    showDeleted?: boolean;
  },
) {
  // Whether ZenStack *would* let the caller see a deleted row and whether
  // this list opts into showing them are separate questions — the list
  // page has an explicit "show deleted" toggle, so `includeDeleted` still
  // requires both the policy and the request to ask for it.
  const includeDeleted = input.showDeleted === true && canSeeDeleted(locals);
  const categories = input.category
    ? Array.isArray(input.category)
      ? input.category
      : [input.category]
    : undefined;

  const page = input.page && input.page > 0 ? input.page : 1;
  const take = PAGE_SIZE;
  const skip = (page - 1) * take;
  const where = queries.buildWhere({
    search: input.search,
    categories,
    includeDeleted,
  });

  const [rows, totalCount] = await Promise.all([
    queries.findMany(locals.prisma, { where, take, skip }),
    queries.count(locals.prisma, where),
  ]);

  return {
    songs: rows.map(toSongDto),
    page,
    pageCount: Math.ceil(totalCount / take),
    totalCount,
  };
}

export async function get(
  locals: App.Locals,
  slug: string,
): Promise<z.infer<typeof SongDto>> {
  return toSongDto(await fetchSong(locals, slug));
}

export async function categories(
  locals: App.Locals,
  showDeleted = false,
): Promise<string[]> {
  const includeDeleted = showDeleted && canSeeDeleted(locals);
  return queries.distinctCategories(locals.prisma, includeDeleted);
}

export async function melodies(
  locals: App.Locals,
  showDeleted = false,
): Promise<string[]> {
  const includeDeleted = showDeleted && canSeeDeleted(locals);
  return queries.distinctMelodies(locals.prisma, includeDeleted);
}

export async function create(
  locals: App.Locals,
  input: {
    title: string;
    lyrics: string;
    melody?: string | null;
    category?: string | null;
    video?: string | null;
  },
): Promise<z.infer<typeof SongDto>> {
  const title = input.title.trim();
  const now = new Date();
  const slug = await queries.uniqueSlug(locals.prisma, title);
  const song = await queries.create(locals.prisma, {
    title: fixSongText(DOMPurify.sanitize(title)),
    slug,
    lyrics: fixSongText(DOMPurify.sanitize(input.lyrics.trim())),
    melody: input.melody?.trim() || null,
    category: input.category?.trim() || null,
    video: input.video?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });
  return toSongDto(song);
}

export async function update(
  locals: App.Locals,
  input: {
    slug: string;
    title?: string;
    lyrics?: string;
    melody?: string | null;
    category?: string | null;
    video?: string | null;
  },
): Promise<z.infer<typeof SongDto>> {
  const { slug, ...fields } = input;
  const song = await queries.updateBySlug(locals.prisma, slug, {
    ...(fields.title !== undefined && {
      title: fixSongText(DOMPurify.sanitize(fields.title.trim())),
    }),
    ...(fields.lyrics !== undefined && {
      lyrics: fixSongText(DOMPurify.sanitize(fields.lyrics.trim())),
    }),
    ...(fields.melody !== undefined && {
      melody: fields.melody?.trim() || null,
    }),
    ...(fields.category !== undefined && {
      category: fields.category?.trim() || null,
    }),
    ...(fields.video !== undefined && {
      video: fields.video?.trim() || null,
    }),
    updatedAt: new Date(),
  });
  return toSongDto(song);
}
