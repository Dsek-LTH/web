import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

export type CommentType = "NEWS" | "EVENT";

export type CommentMember = ExtendedPrismaModel<"Member">;

type BaseComment =
  ExtendedPrismaModel<"ArticleComment"> | ExtendedPrismaModel<"EventComment">;

export type CommentWithMember = Omit<BaseComment, "memberId"> & {
  /** Null on removed comments (see hideRemovedCommentAuthors). */
  member: CommentMember | null;
  /** Null on removed comments (see hideRemovedCommentAuthors). */
  memberId: string | null;
};

export type MentionRequest = {
  id: number;
  member: CommentMember;
};
