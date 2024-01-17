import apiNames from "$lib/utils/apiNames";
import prisma from "$lib/utils/prisma";
import type { Song } from "@prisma/client";

export async function getExistingCategories(): Promise<string[]> {
  const existingCategories = (
    await prisma.song.findMany({
      distinct: ["category"],
      orderBy: {
        category: "asc",
      },
      select: {
        category: true,
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

export async function getExistingMelodies(): Promise<string[]> {
  const existingMelodies = (
    await prisma.song.findMany({
      distinct: ["melody"],
      orderBy: {
        melody: "asc",
      },
      select: {
        melody: true,
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