/**
 * Decides the final image list and the cover of an article. It is used by both
 * the server actions (with the URLs of the files that were just uploaded) and
 * the editor preview (with object URLs), so the preview shows the same cover
 * that gets saved.
 *
 * - `existing` are images that are already uploaded and still kept.
 * - `newUrls` are the newly picked images, in the order they were picked.
 *
 * The cover is, in order of priority:
 * 1. the new image at `coverNewIndex`,
 * 2. `coverUrl`, if it is still one of `existing`,
 * 3. the first image,
 * 4. nothing, when there are no images.
 */
export const resolveImages = ({
  existing,
  newUrls,
  coverUrl,
  coverNewIndex,
}: {
  existing: string[];
  newUrls: string[];
  coverUrl?: string | null;
  coverNewIndex?: number | null;
}): { imageUrls: string[]; imageUrl: string | null } => {
  const imageUrls = [...existing, ...newUrls];

  const newCover = coverNewIndex != null ? newUrls[coverNewIndex] : undefined;
  const existingCover =
    coverUrl != null && existing.includes(coverUrl) ? coverUrl : undefined;

  return {
    imageUrls,
    imageUrl: newCover ?? existingCover ?? imageUrls[0] ?? null,
  };
};
