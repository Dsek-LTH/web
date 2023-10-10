export const slugify = (str: string) => {
  const slug = str.replace(/\s+/g, "-").toLowerCase();
  return slug.length > 50 ? slug.slice(0, 50) : slug;
};

export const slugifyArticleHeader = (header: string) => {
  const slugifiedHeader = slugify(header);
  return slugifiedHeader;
};
