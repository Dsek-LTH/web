import { createSchema, updateSchema } from "$lib/news/schema";
import { toAuthorInput } from "$lib/news/authorOptions";
import { redirect } from "sveltekit-flash-message/server";
import * as m from "$paraglide/messages";
import { type Action } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, fail } from "sveltekit-superforms";
import { serverApi } from "$lib/server/apiClient";
import type { components } from "$lib/api/schema";

type ArticleInput = components["schemas"]["ArticleInput"];

async function uploadImage(
  api: ReturnType<typeof serverApi>,
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await api.POST("/uploads", {
    body: form as unknown as { file: string },
  });
  if (res.error) throw new Error("Failed to upload image");
  return res.data.url;
}

// Slug generation, author resolution, body sanitization, image storage,
// and the schedule-vs-notify-now decision all now happen server-side in
// the Go API (backend/internal/articles, backend/internal/integrations) -
// this file just validates the form, uploads images, and forwards the
// result. See ../../../DESIGN.md.

export const createArticle: Action = async (event) => {
  const { request } = event;
  const api = serverApi(event);
  const form = await superValidate(request, zod4(createSchema), {
    allowFiles: true,
  });
  if (!form.valid) return fail(400, { form });
  const {
    author,
    tags,
    headerSv,
    headerEn,
    sendNotification,
    notificationText,
    images,
    bodySv,
    bodyEn,
    committeeId,
    publishTime,
    youtubeUrl,
  } = form.data;

  const imageUrls = await Promise.all(
    Array.from(images).map((image) => uploadImage(api, image)),
  );

  const input: ArticleInput = {
    headerSv,
    headerEn: headerEn ?? null,
    bodySv,
    bodyEn: bodyEn ?? null,
    imageUrl: imageUrls[0] ?? null,
    imageUrls,
    youtubeUrl: youtubeUrl ?? null,
    author: toAuthorInput(author),
    tagIds: tags.filter((tag) => !!tag).map((tag) => tag.id),
    committeeId: committeeId ?? null,
    publishedAt: (publishTime ?? new Date()).toISOString(),
    sendNotification,
    notificationText: notificationText ?? null,
    // No season picker UI exists yet for articles (see backend/CLAUDE.md's
    // Nollning routes section) - always null here until one's built.
    nollningSeasonId: null,
  };

  const created = await api.POST("/articles", { body: input });
  if (created.error) throw new Error("Failed to create article");
  const publishTimeIsInFuture = publishTime && publishTime > new Date();

  throw redirect(
    publishTimeIsInFuture ? "/news" : `/news/${created.data.slug}`,
    {
      message: publishTimeIsInFuture ? m.news_articleScheduled() : m.news_articleCreated(),
      type: "success",
    },
    event,
  );
};

export const updateArticle: Action<{ slug: string }> = async (event) => {
  const { request } = event;
  const api = serverApi(event);
  const form = await superValidate(request, zod4(updateSchema), {
    allowFiles: true,
  });
  if (!form.valid) return fail(400, { form });
  const {
    slug,
    author,
    tags,
    images,
    headerSv,
    headerEn,
    bodySv,
    bodyEn,
    committeeId,
    publishTime,
    sendNotification,
    notificationText,
    imageUrl,
    imageUrls,
    youtubeUrl,
  } = form.data;

  const newImages = await Promise.all(
    Array.from(images).map((image) => uploadImage(api, image)),
  );
  const finalImageUrls = imageUrls === undefined ? newImages : [...imageUrls, ...newImages];

  const input: ArticleInput = {
    headerSv,
    headerEn: headerEn ?? null,
    bodySv,
    bodyEn: bodyEn ?? null,
    imageUrl: imageUrl ?? null,
    imageUrls: finalImageUrls,
    youtubeUrl: youtubeUrl ?? null,
    author: toAuthorInput(author),
    tagIds: tags.filter((tag) => !!tag).map((tag) => tag.id),
    committeeId: committeeId ?? null,
    publishedAt: publishTime ? publishTime.toISOString() : null,
    sendNotification,
    notificationText: notificationText ?? null,
    // Always null (same as createArticle above, and events' identical
    // note) - since this form can only ever have produced a null value on
    // create, always sending null on update doesn't lose data yet. Once a
    // season picker exists, this needs to round-trip the article's
    // existing value instead of hardcoding null.
    nollningSeasonId: null,
  };

  const updated = await api.PATCH("/articles/{slug}", {
    params: { path: { slug } },
    body: input,
  });
  if (updated.error) {
    if (updated.response.status === 404) {
      return message(
        form,
        { message: m.news_errors_articleNotFound(), type: "error" },
        { status: 400 },
      );
    }
    throw new Error("Failed to update article");
  }

  throw redirect(
    `/news/${publishTime && publishTime < new Date() ? event.params.slug : ""}`,
    {
      message: m.news_articleUpdated(),
      type: "success",
    },
    event,
  );
};
