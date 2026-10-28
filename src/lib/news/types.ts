import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

export type ArticleTagSummary = {
  id: string;
  name: string;
  color: string | null;
};

export type ArticleCommitteeSummary = Pick<
  ExtendedPrismaModel<"Committee">,
  "id" | "shortName" | "symbolUrl" | "name"
>;

export type ArticleAuthorSummary = {
  member: Pick<
    ExtendedPrismaModel<"Member">,
    "firstName" | "lastName" | "nickname" | "studentId" | "picturePath"
  >;
  customAuthor: Pick<
    ExtendedPrismaModel<"CustomAuthor">,
    "name" | "imageUrl"
  > | null;
  mandate: {
    position: Pick<ExtendedPrismaModel<"Position">, "id" | "name">;
  } | null;
  type: ExtendedPrismaModel<"Author">["type"];
};

export type ArticleContentData = {
  header: string;
  body: string;
  createdAt: Date;
  imageUrls: string[];
  tags: ArticleTagSummary[];
  youtubeUrl: string | null;
};

export type ArticleCardData = {
  author: ArticleAuthorSummary;
  slug: string;
  imageUrl: string | null;
  header: string;
  body: string;
  createdAt: Date;
  committee: ArticleCommitteeSummary | null;
  youtubeUrl: string | null;
};

export type ArticleSmallCardData = {
  slug: string;
  imageUrl: string | null;
  header: string;
  publishedAt: Date | null;
  committee: ArticleCommitteeSummary | null;
  youtubeUrl: string | null;
};
