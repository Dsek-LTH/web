import { fail, type Action } from "@sveltejs/kit";
import {
  message,
  superValidate,
  type Infer,
} from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod";
import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";

// The acting member is resolved server-side in Go from the (currently
// mocked) request identity - see ../../../lib/api/client.ts and
// ../../../../DESIGN.md's Auth section. The "member liked your article"
// notification also now happens there (mocked, so it's currently a no-op).
export const likeSchema = z.object({
  slug: z.string(),
});
export type LikeSchema = Infer<typeof likeSchema>;

export const likesAction =
  (shouldLike: boolean): Action =>
  async ({ request }) => {
    const form = await superValidate(request, zod4(likeSchema));
    if (!form.valid) return fail(400, { form });

    if (shouldLike) {
      await api.POST("/articles/{slug}/likes", {
        params: { path: { slug: form.data.slug } },
      });
    } else {
      await api.DELETE("/articles/{slug}/likes", {
        params: { path: { slug: form.data.slug } },
      });
    }

    return message(form, {
      message: shouldLike
        ? m.news_likedArticle()
        : m.news_stoppedLikingArticle(),
      type: "hidden",
    });
  };
