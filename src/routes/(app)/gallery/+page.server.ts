import { PUBLIC_BUCKETS_ALBUMS } from "$env/static/public";
import { fileHandler } from "$lib/files";
import type { FileData } from "$lib/files/fileHandler";
import {
  getNollningStart,
  isNollningPeriod,
} from "$lib/utils/adminSettings/nollning";
import { isAuthorized } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";
import apiNames from "$lib/utils/apiNames";

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;

  const files: FileData[] = await fileHandler
    .getInBucket(user, PUBLIC_BUCKETS_ALBUMS, "public/", true)
    .catch((err) => {
      console.error("Error fetching files", err);
      return [];
    });

  const filesGroupedByAlbum = files.reduce<Record<string, FileData[]>>(
    (acc, file) => {
      const fileParts = file.id.split("/");
      const album = fileParts[fileParts.length - 2] ?? "unknown";
      if (!acc[album]) acc[album] = [];
      acc[album]!.push(file);
      return acc;
    },
    {},
  );

  let albumEntries = Object.entries(filesGroupedByAlbum);
  const nollningPeriod = await isNollningPeriod();
  const nollningStart = await getNollningStart();

  if (nollningPeriod && !isAuthorized(apiNames.MEMBER.SEE_STABEN, user)) {
    albumEntries = albumEntries.filter(
      (a) =>
        Date.parse(a[0].split(" ")[0]!) >
        (nollningStart ?? new Date(0)).getTime(),
    );
  }

  return {
    albums: albumEntries,
  };
};
