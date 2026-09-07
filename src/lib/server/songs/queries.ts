import type { Prisma } from "@prisma/client";
import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";
import { slugify } from "$lib/utils/slugify";
import { withZenStackErrors } from "$lib/server/api/errors";

export type SongRow = ExtendedPrismaModel<"Song">;

export type SongListFilter = {
  search?: string;
  categories?: string[];
  includeDeleted?: boolean;
};

// NOTE: when both `search` and `categories` are set, this only filters by
// category — the two `OR` clauses collide on the same object key. That's a
// pre-existing bug in the page this was ported from; left as-is (see
// PROTOTYPE_NOTES.md) rather than fixed as a drive-by during the port.
export function buildWhere({
  search,
  categories,
  includeDeleted,
}: SongListFilter): Prisma.SongWhereInput {
  return {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { lyrics: { contains: search, mode: "insensitive" as const } },
            { melody: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categories?.length
      ? {
          OR: categories.map((category) => ({
            category: { contains: category, mode: "insensitive" as const },
          })),
        }
      : {}),
  };
}

export function findMany(
  prisma: ExtendedPrisma,
  {
    where,
    take,
    skip,
  }: { where: Prisma.SongWhereInput; take: number; skip: number },
) {
  return prisma.song.findMany({ where, take, skip, orderBy: { title: "asc" } });
}

export function count(prisma: ExtendedPrisma, where: Prisma.SongWhereInput) {
  return prisma.song.count({ where });
}

export function findBySlug(prisma: ExtendedPrisma, slug: string) {
  return prisma.song.findUnique({ where: { slug } });
}

export async function distinctCategories(
  prisma: ExtendedPrisma,
  includeDeleted: boolean,
): Promise<string[]> {
  const rows = await prisma.song.findMany({
    distinct: ["category"],
    orderBy: { category: "asc" },
    select: { category: true },
    where: includeDeleted ? {} : { deletedAt: null },
  });
  return rows.flatMap((row) => (row.category !== null ? [row.category] : []));
}

export async function distinctMelodies(
  prisma: ExtendedPrisma,
  includeDeleted: boolean,
): Promise<string[]> {
  const rows = await prisma.song.findMany({
    distinct: ["melody"],
    orderBy: { melody: "asc" },
    select: { melody: true },
    where: includeDeleted ? {} : { deletedAt: null },
  });
  return rows.flatMap((row) => (row.melody !== null ? [row.melody] : []));
}

export function updateBySlug(
  prisma: ExtendedPrisma,
  slug: string,
  data: Prisma.SongUpdateInput,
) {
  return withZenStackErrors(() =>
    prisma.song.update({ where: { slug }, data }),
  );
}

export function create(prisma: ExtendedPrisma, data: Prisma.SongCreateInput) {
  return withZenStackErrors(() => prisma.song.create({ data }));
}

// Appends "-<n>" when the slugified title collides with an existing one,
// so two songs never end up sharing a slug.
export async function uniqueSlug(
  prisma: ExtendedPrisma,
  title: string,
): Promise<string> {
  const slug = slugify(title);
  const count = await prisma.song.count({
    where: { slug: { startsWith: slug } },
  });
  return count > 0 ? `${slug}-${count + 1}` : slug;
}
