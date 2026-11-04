/**
 * Which form field a Go 409 from /songbook is about: the page/number
 * already has a song ("position"), or the song is already in the book.
 */
export const songBookConflictField = (
  status: number,
  detail: string | undefined,
): "numberOnPage" | "songId" | null => {
  if (status !== 409) return null;
  return detail?.includes("position") ? "numberOnPage" : "songId";
};
