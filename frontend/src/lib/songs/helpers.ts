// getExistingCategories/getExistingMelodies/canAccessDeletedSongs/
// fixSongText/groupCategories all moved server-side into the Go API
// (backend/internal/songs - GET /songs/categories(/grouped), /melodies;
// FixSongText/GroupCategories in text.go). mayWatchVideos stays
// here: a purely client-visible UI gate over data already sent to the
// client (see the song pages' own note on this), not a real
// access boundary Go needs to enforce.

export function mayWatchVideos(
  user?: { roles?: string[] | null } | null,
): boolean {
  const roles = user?.roles ?? [];
  return roles.includes("C") || roles.includes("D") || roles.includes("VR/AR");
}

/**
 * Group categories together and map them to their simplified group ID.
 * - "SåS ..." categories are grouped by their first two words (e.g. "SåS Fria").
 *   If "SåS" has no second word, it's grouped by itself.
 * - All other categories are grouped by their first word (e.g. "Nollningen").
 *
 * The first category seen for a group is used as its display name; if a
 * second category maps to the same group, the display name falls back to
 * the group ID itself (since a single category name would no longer be accurate).
 */
export function groupCategories(
  rawCategories: string[],
): Record<string, string> {
  const categoryMap: Record<string, string> = {};

  for (const category of rawCategories) {
    const words = category.split(" ");
    const firstWord = words[0];
    if (!firstWord) continue;

    const groupId =
      firstWord === "SåS" ? words.slice(0, 2).join(" ") : firstWord;

    categoryMap[groupId] =
      categoryMap[groupId] !== undefined ? groupId : category;
  }

  return categoryMap;
}
