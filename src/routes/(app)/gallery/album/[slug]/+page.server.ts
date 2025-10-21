import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user } = locals;
  const album = params.slug;

  let pictures: FileData[] = await fileHandler
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

  type Metadata = {
    photographer: string;
    editor: string;
  };

  const metadataUrl = pictures.filter((e) => e.name == "album.json")[0]
    ?.thumbnailUrl;
  let metadata: Metadata | undefined;
  if (metadataUrl) {
    metadata = await fetch(metadataUrl)
      .then((res) => res.text())
      .then((text) => JSON.parse(text));
  }

  pictures = pictures.filter((e) => e.name != "album.json");

  return {
    album: album,
    pictures: pictures,
    metadata: metadata,
  };
};
