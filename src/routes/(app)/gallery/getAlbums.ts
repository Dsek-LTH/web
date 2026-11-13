import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import fileHandler from "$lib/files/fileHandler";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { AlbumSchema } from "./schema";
import type { AuthUser } from "@zenstackhq/runtime";

export const getAlbums = async (
  prisma: ExtendedPrisma,
  user: AuthUser | undefined,
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

  async function getCoverURL(albumId: string): Promise<string> {
    return fileHandler
      .getInBucket(
        user,
        PUBLIC_BUCKETS_ALBUMS,
        "public/" + albumId + "/cover",
        true,
      )
      .then((files) => files[0]?.thumbnailUrl || "")
      .catch((err) => {
        console.error("Error fetching files", err);
        return "";
      });
  }

  async function getAlbumLength(albumId: string): Promise<number> {
    return fileHandler
      .getInBucket(
        user,
        PUBLIC_BUCKETS_ALBUMS,
        "public/" + albumId + "/album",
        true,
      )
      .then((files) => files.length || 0)
      .catch((err) => {
        console.error("Error fetching files", err);
        return 0;
      });
  }

  return Promise.all(
    albums.map(async (album) => ({
      id: album.id,
      title: album.title,
      date: album.date.toISOString(),
      slug: album.slug,
      imageCount: await getAlbumLength(album.id),
      coverURL: await getCoverURL(album.id),
      photographers: album.photographers.map(({ ...rest }) => rest),
      editors: album.editors.map(({ ...rest }) => rest),
    })),
  );
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
