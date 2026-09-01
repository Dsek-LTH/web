import { fail, type Action } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";

import { z } from "zod";
import { api } from "$lib/api/client";

export const commentSchema = z.object({
  content: z.string().min(1),
});
export type CommentSchema = Infer<typeof commentSchema>;

export const removeCommentSchema = z.object({
  commentId: z.string(),
});
export type RemoveCommentSchema = Infer<typeof removeCommentSchema>;

export const commentAction =
  (entityType: "NEWS" | "EVENT"): Action =>
  async ({ request, params }) => {
    const form = await superValidate(request, zod4(commentSchema));
    if (!form.valid) return fail(400, { form });
    const slug = params["slug"] ?? "";

    // The acting member is resolved server-side in Go from the (currently
    // mocked) request identity - see $lib/api/client and ../../DESIGN.md's
    // Auth section - and content is sanitized there too
    // (backend/internal/articles, backend/internal/events), so neither
    // happens here.
    switch (entityType) {
      case "NEWS":
        await api.POST("/articles/{slug}/comments", {
          params: { path: { slug } },
          body: { content: form.data.content },
        });
        break;
      case "EVENT":
        await api.POST("/events/{slug}/comments", {
          params: { path: { slug } },
          body: { content: form.data.content },
        });
        break;
      default:
        return message(
          form,
          {
            message: 'Kommentar skickades inte. "Invalid comment entity type"',
            type: "error",
          },
          {
            status: 400,
          },
        );
    }
    return message(form, {
      message: "Kommentar skickad",
      type: "hidden",
    });
  };

export const removeCommentAction =
  (entityType: "NEWS" | "EVENT"): Action =>
  async ({ request, params }) => {
    const form = await superValidate(request, zod4(removeCommentSchema));
    if (!form.valid) return fail(400, { form });
    const slug = params["slug"] ?? "";

    switch (entityType) {
      case "NEWS":
        await api.DELETE("/articles/{slug}/comments/{commentId}", {
          params: { path: { slug, commentId: form.data.commentId } },
        });
        break;
      case "EVENT":
        await api.DELETE("/events/{slug}/comments/{commentId}", {
          params: { path: { slug, commentId: form.data.commentId } },
        });
        break;
      default:
        return message(
          form,
          {
            message:
              'Kommentar kunde inte tas bort. "Invalid comment entity type"',
            type: "error",
          },
          {
            status: 400,
          },
        );
    }
    return message(form, {
      message: "Kommentar borttagen",
      type: "success",
    });
  };
