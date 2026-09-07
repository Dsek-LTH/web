export function mayWatchVideos(user?: { roles: string[] } | null): boolean {
  if (!user) return false;
  return (
    user.roles.includes("C") ||
    user.roles.includes("D") ||
    user.roles.includes("VR/AR")
  );
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
