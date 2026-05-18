import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { AlbumSchema } from "../../schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = locals;
  const albumData = await locals.prisma.album.findFirst({
    where: { slug: params.slug },
    include: {
      photographers: true,
      editors: true,
    },
  });

  const album: AlbumSchema | null = albumData
    ? {
        id: albumData.id,
        title: albumData.title,
        date: albumData.date.toISOString(),
        slug: albumData.slug,
        description: albumData.description || undefined,
        imageCount: albumData.imageCount,
        photographers: albumData.photographers.map(({ id, ...rest }) => rest),
        editors: albumData.editors.map(({ id, ...rest }) => rest),
      }
    : null;

  let pictures: FileData[] = [];
  if (album) {
    pictures = await fileHandler
      .getInBucket(
        user,
        PUBLIC_BUCKETS_ALBUMS,
        "public/" + album.slug + "/album",
        true,
      )
      .catch((err) => {
        console.error("Error fetching files", err);
        return [];
      });
  }

  return {
    album: album,
    pictures: pictures,
  };
};
