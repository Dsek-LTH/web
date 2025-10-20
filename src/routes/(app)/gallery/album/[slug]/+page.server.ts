import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = locals;
  const album = params.slug;

  const pictures: FileData[] = await fileHandler
    .getInBucket(
      user,
      PUBLIC_BUCKETS_ALBUMS,
      "public/" + album.split("-")[0] + "/" + album,
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
