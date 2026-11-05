import { fail, type Action } from "@sveltejs/kit";
import { message, superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { serverApi } from "$lib/server/apiClient";
import { commentSchema, removeCommentSchema } from "$lib/zod/comments";
import * as m from "$paraglide/messages";

type CommentEntity = "NEWS" | "EVENT";

/**
 * The `?/comment` action for an article or event detail page (the
 * CommentSection form posts here). Sanitizing, the length check, and the
 * comment permission all happen in Go.
 */
export const commentAction =
  (entityType: CommentEntity): Action<{ slug: string }> =>
  async (event) => {
    const form = await superValidate(event.request, zod4(commentSchema));
    if (!form.valid) return fail(400, { form });
    const api = serverApi(event);
    const slug = event.params.slug;
    const body = { content: form.data.content };
    const res =
      entityType === "NEWS"
        ? await api.POST("/articles/{slug}/comments", {
            params: { path: { slug } },
            body,
          })
        : await api.POST("/events/{slug}/comments", {
            params: { path: { slug } },
            body,
          });
    if (res.error) {
      return message(
        form,
        {
          message: res.error.detail ?? m.comments_errors_invalidEntity(),
          type: "error",
        },
        { status: 400 },
      );
    }
    return message(form, {
      message: m.comments_posted(),
      type: "success",
    });
  };

/**
 * The `?/removeComment` action - Go allows the comment's own author or a
 * moderator (see the per-comment `canDelete` it returns).
 */
export const removeCommentAction =
  (entityType: CommentEntity): Action<{ slug: string }> =>
  async (event) => {
    const form = await superValidate(event.request, zod4(removeCommentSchema));
    if (!form.valid) return fail(400, { form });
    const api = serverApi(event);
    const path = { slug: event.params.slug, commentId: form.data.commentId };
    const res =
      entityType === "NEWS"
        ? await api.DELETE("/articles/{slug}/comments/{commentId}", {
            params: { path },
          })
        : await api.DELETE("/events/{slug}/comments/{commentId}", {
            params: { path },
          });
    if (res.error) {
      return message(
        form,
        {
          message: res.error.detail ?? m.comments_errors_invalidEntity(),
          type: "error",
        },
        { status: 400 },
      );
    }
    return message(form, {
      message: m.comments_removed(),
      type: "success",
    });
  };
