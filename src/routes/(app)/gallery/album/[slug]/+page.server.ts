import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = locals;
  const album = await locals.prisma.album.findFirst({
    where: { slug: params.slug },
    include: {
      photographers: true,
      editors: true,
    },
  });

  let pictures: FileData[] = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_ALBUMS,
      "public/" + album?.slug + "/album",
      true,
    )
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

  return {
    album: album,
    pictures: pictures,
  };
};
