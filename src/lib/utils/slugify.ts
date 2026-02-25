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
