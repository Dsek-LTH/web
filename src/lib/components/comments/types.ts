import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

export type CommentType = "NEWS" | "EVENT";

export type CommentMember = ExtendedPrismaModel<"Member">;

type BaseComment =
  | ExtendedPrismaModel<"ArticleComment">
  | ExtendedPrismaModel<"EventComment">;

export type CommentWithMember = BaseComment & {
  member: CommentMember;
};

export type MentionRequest = {
  id: number;
  member: CommentMember;
};
