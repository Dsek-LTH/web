import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

// Instant-feedback validation for the comment form only (DESIGN.md's
// principle #5) - Go's internal/comments.Normalize enforces the same
// trim/1-255 rule, and is what actually decides.
export const commentSchema = z.object({
  content: z.string().trim().min(1).max(255),
});
export type CommentSchema = Infer<typeof commentSchema>;

export const removeCommentSchema = z.object({
  commentId: z.string(),
});
export type RemoveCommentSchema = Infer<typeof removeCommentSchema>;
