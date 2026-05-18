import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import fileHandler from "$lib/files/fileHandler";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import { get } from "http";
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

  function getCoverURL(slug: string): Promise<string> {
    return fileHandler
      .getInBucket(
        user,
        PUBLIC_BUCKETS_ALBUMS,
        "public/" + slug + "/cover",
        true,
      )
      .then((files) => files[0]?.thumbnailUrl || "")
      .catch((err) => {
        console.error("Error fetching files", err);
        return "";
      });
  }

  return Promise.all(
    albums.map(async (album) => ({
      id: album.id,
      title: album.title,
      date: album.date.toISOString(),
      slug: album.slug,
      imageCount: album.imageCount,
      coverURL: await getCoverURL(album.slug),
      photographers: album.photographers.map(
        ({ id, visible, stripeCustomerId, ...rest }) => rest,
      ),
      editors: album.editors.map(
        ({ id, visible, stripeCustomerId, ...rest }) => rest,
      ),
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
