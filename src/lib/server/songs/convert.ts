import type { z } from "zod";
import type { SongRow } from "./queries";
import type { SongDto } from "./dto";

/**
 * Replaces plain-text shorthand editors type in lyrics/titles with the
 * proper typographic characters. Applied on every write (so the DB holds
 * display-ready text, and there's no separate "raw" shape to track) and
 * still applied here on every read too, idempotently — that's what keeps
 * rows written before this existed consistent with new ones, and keeps
 * list/detail from ever showing the same song two different ways.
 */
export function fixSongText(s: string): string {
  return s
    .replaceAll("---", "—")
    .replaceAll("--", "–")
    .replaceAll("||:", "𝄆")
    .replaceAll(":||", "𝄇")
    .replaceAll("|:", "𝄆")
    .replaceAll(":|", "𝄇");
}

export function toSongDto(song: SongRow): z.infer<typeof SongDto> {
  return {
    id: song.id,
    slug: song.slug,
    title: fixSongText(song.title),
    lyrics: fixSongText(song.lyrics),
    melody: song.melody,
    category: song.category,
    video: song.video,
    createdAt: song.createdAt?.toISOString() ?? null,
    updatedAt: song.updatedAt?.toISOString() ?? null,
    deletedAt: song.deletedAt?.toISOString() ?? null,
  };
}
