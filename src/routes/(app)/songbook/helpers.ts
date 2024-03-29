import apiNames from "$lib/utils/apiNames";
import type { PrismaClient, Song } from "@prisma/client";

export async function getExistingCategories(
  prisma: PrismaClient,
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
  ).reduce<Array<NonNullable<Song["category"]>>>((acc, cur) => {
    if (cur.category !== null) {
      acc.push(cur.category);
    }
    return acc;
  }, []);
  return existingCategories;
}

export async function getExistingMelodies(
  prisma: PrismaClient,
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
  ).reduce<Array<NonNullable<Song["melody"]>>>((acc, cur) => {
    if (cur.melody !== null) {
      acc.push(cur.melody);
    }
    return acc;
  }, []);
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
