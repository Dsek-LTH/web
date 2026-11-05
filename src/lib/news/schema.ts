import { isFileImage } from "$lib/files/utils";
import { authorSchema, tagSchema } from "$lib/zod/schemas";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { getYoutubeVideoId } from "$lib/utils/youtube";
import * as m from "$paraglide/messages";

// Messages are functions so they are translated per validation (per request on the server),
// not once at import time.

export const articleSchema = z.object({
  slug: z.string(),
  headerSv: z.string().min(1, { error: () => m.news_errors_titleRequired() }),
  headerEn: z.string().nullable(),
  bodySv: z.string().default(""),
  bodyEn: z.string().nullable(),
  author: authorSchema,
  tags: z
    .array(
      tagSchema.pick({
        id: true,
      }),
    )
    .default([]),
  imageUrls: z.string().array().optional(),
  imageUrl: z.string().optional().nullable(),
  youtubeUrl: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || getYoutubeVideoId(value) !== null, {
      error: () => m.news_errors_invalidYoutube(),
    }),
  publishTime: z.date().optional().nullable(),
  // https://github.com/colinhacks/zod/pull/3118
  images: z
    .instanceof(File, { error: () => m.news_errors_notAnImage() })
    .refine((file) => !file || isFileImage(file), {
      error: () => m.news_errors_notAnImage(),
    })
    .array()
    .default([]),
  /**
   * Which image becomes the cover, as an index into `[...imageUrls, ...images]`
   * (existing images first, then new uploads). Null means "keep the current cover"
   * when editing and "first image" when creating.
   */
  coverImageIndex: z.number().int().min(0).nullable().optional(),
  committeeId: z.uuid().nullable(),
  notificationText: z.string().max(255).optional().nullable(),
  sendNotification: z.boolean(),
});
export type ArticleSchema = Infer<typeof articleSchema>;

export const createSchema = articleSchema
  .omit({
    slug: true,
  })
  .refine((data) => data.sendNotification === false || data.tags.length > 0, {
    error: () => m.news_errors_tagsForNotification(),
    path: ["tags"],
  });

export const updateSchema = articleSchema.refine(
  (data) => data.sendNotification === false || data.tags.length > 0,
  {
    error: () => m.news_errors_tagsForNotification(),
    path: ["tags"],
  },
);
