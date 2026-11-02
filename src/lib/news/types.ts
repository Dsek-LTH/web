import type { components } from "$lib/api/schema";
import type AuthorCard from "$lib/components/AuthorCard.svelte";
import type { ComponentProps } from "svelte";

// Shapes the article components render. Go's ArticleSummary/ArticleDetail
// satisfy these directly; the editor preview builds them from the form.

export type ArticleTagSummary = {
  id: string;
  name: string;
  color?: string | null;
};

export type ArticleCommitteeSummary = Pick<
  components["schemas"]["Committee"],
  "id" | "name" | "shortName" | "symbolUrl"
>;

/** The byline author - the same shape AuthorCard takes. */
export type ArticleAuthorSummary = ComponentProps<typeof AuthorCard>["author"];

export type ArticleContentData = {
  header: string;
  body: string;
  createdAt: Date | string;
  imageUrls?: string[] | null;
  tags?: ArticleTagSummary[] | null;
  youtubeUrl?: string | null;
};

export type ArticleCardData = {
  author: ArticleAuthorSummary;
  slug: string;
  imageUrl?: string | null;
  header: string;
  body: string;
  createdAt: Date | string;
  committee?: ArticleCommitteeSummary | null;
  youtubeUrl?: string | null;
};

export type ArticleSmallCardData = {
  slug: string;
  imageUrl?: string | null;
  header: string;
  publishedAt?: Date | string | null;
  committee?: ArticleCommitteeSummary | null;
  youtubeUrl?: string | null;
};
