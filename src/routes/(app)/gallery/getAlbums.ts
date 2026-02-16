import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { AlbumSchema } from "./schema";

export const getAlbums = async (
  prisma: ExtendedPrisma,
): Promise<AlbumSchema[]> => {
  const albums = await prisma.album.findMany({
    include: {
      photographers: true,
      editors: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return albums.map((album) => ({
    id: album.id,
    title: album.title,
    date: album.date.toISOString(),
    slug: album.slug,
    imageCount: album.imageCount,
    photographers: album.photographers,
    editors: album.editors,
  }));
};

export const getAlbum = async (
  prisma: ExtendedPrisma,
  slug: string,
): Promise<AlbumSchema | null> => {
  const album = await prisma.album.findFirst({
    where: { slug: slug },
    include: {
      photographers: true,
      editors: true,
    },
  });

  if (!album) {
    return null;
  }

  return {
    id: album.id,
    title: album.title,
    date: album.date.toISOString(),
    slug: album.slug,
    imageCount: album.imageCount,
    photographers: album.photographers,
    editors: album.editors,
  };
};
