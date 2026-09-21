import apiNames from "$lib/utils/apiNames";
import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

export async function getExistingCategories(
  prisma: ExtendedPrisma,
  accessPolicies: string[] = [],
  includeDeleted = false,
): Promise<string[]> {
  if (!accessPolicies.includes(apiNames.SONG.DELETE)) {
    includeDeleted = false;
  }
  const existingCategories = (
    await prisma.song.findMany({
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
      select: {
        category: true,
      },
      where: includeDeleted
        ? {}
        : {
            deletedAt: null,
          },
    })
  ).reduce<Array<NonNullable<ExtendedPrismaModel<"Song">["category"]>>>(
    (acc, cur) => {
      if (cur.category !== null) {
        acc.push(cur.category);
      }
      return acc;
    },
    [],
  );
  return existingCategories;
}

export async function getExistingMelodies(
  prisma: ExtendedPrisma,
  accessPolicies: string[] = [],
  includeDeleted = false,
): Promise<string[]> {
  if (!accessPolicies.includes(apiNames.SONG.DELETE)) {
    includeDeleted = false;
  }
  const existingMelodies = (
    await prisma.song.findMany({
      distinct: ["melody"],
      orderBy: {
        melody: "asc",
      },
      select: {
        melody: true,
      },
      where: includeDeleted
        ? {}
        : {
            deletedAt: null,
          },
    })
  ).reduce<Array<NonNullable<ExtendedPrismaModel<"Song">["melody"]>>>(
    (acc, cur) => {
      if (cur.melody !== null) {
        acc.push(cur.melody);
      }
      return acc;
    },
    [],
  );
  return existingMelodies;
}

export function canAccessDeletedSongs(accessPolicies: string[]): boolean {
  return accessPolicies.includes(apiNames.SONG.DELETE);
}

export function fixSongText(s: string): string {
  return s
    .replaceAll("---", "—")
    .replaceAll("--", "–")
    .replaceAll("||:", "𝄆")
    .replaceAll(":||", "𝄇")
    .replaceAll("|:", "𝄆")
    .replaceAll(":|", "𝄇");
}

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
