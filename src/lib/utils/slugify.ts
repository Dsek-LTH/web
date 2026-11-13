export const slugify = (str: string, maxLength = 50) =>
  str
    .trim() // trim leading/trailing whitespace
    .normalize("NFKD") // normalize unicode characters and...
    .replace(/\p{Diacritic}/gu, "") // ...remove floating diacritics
    .replace(/['"]+/g, "") // remove quotes
    .replace(/[^a-z0-9]+/gi, "-") // replace non-alphanumeric characters with hyphens
    .replace(/-+/g, "-") // replace multiple hyphens with a single hyphen
    .substring(0, maxLength) // truncate to maxLength characters
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .toLowerCase(); // convert to lowercase

export const slugWithCount = (slug: string, count: number) =>
  count > 0 ? `${slug}-${count + 1}` : slug;

/**
 * Slugifies a title and appends the year, e.g. "nollefredagen-2026".
 * The year is not appended twice if the title already ends with it.
 */
export const slugifyWithYear = (str: string, year: number, maxLength = 50) => {
  const suffix = `-${year}`;
  const base = slugify(str, maxLength - suffix.length);
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
};

/**
 * Returns the first available slug, appending a counter on collisions.
 */
export const findAvailableSlug = async (
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>,
) => {
  let slug = baseSlug;
  let count = 0;
  while (await isTaken(slug)) {
    count += 1;
    slug = slugWithCount(baseSlug, count);
  }
  return slug;
};
