import type { components } from "$lib/api/schema";

export type CommentType = "NEWS" | "EVENT";

export type CommentMember = components["schemas"]["Member"];

/** A comment as Go returns it on an article/event detail. */
export type CommentWithMember = components["schemas"]["Comment"];

export type MentionRequest = {
  id: number;
  member: CommentMember;
};
