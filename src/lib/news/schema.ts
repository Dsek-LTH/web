import { isFileImage } from "$lib/files/utils";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

// Mirrors the Go API's Author shape directly (flat `position`, not a
// nested `mandate.position`) - see backend/CLAUDE.md and
// $lib/components/AuthorCard.svelte. This is what the picker in
// ArticleForm.svelte binds to; on submit it's reduced to the
// `{mandateId?, customId?}` the Go API's AuthorInput actually wants (see
// $lib/news/server/actions.ts) - the member is always resolved
// server-side from the acting identity, never sent here.
const memberSchema = z.object({
  id: z.string(),
  studentId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  picturePath: z.string().optional(),
});
const positionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
const customAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
});
export const authorOptionSchema = z.object({
  type: z.string(),
  member: memberSchema,
  position: positionSchema.optional(),
  customAuthor: customAuthorSchema.optional(),
});
export type AuthorOptionSchema = Infer<typeof authorOptionSchema>;

export const articleSchema = z.object({
  slug: z.string(),
  headerSv: z.string().min(1, "Title cannot be empty"),
  headerEn: z.string().nullable(),
  bodySv: z.string().default(""),
  bodyEn: z.string().nullable(),
  author: authorOptionSchema,
  tags: z.array(z.object({ id: z.uuid() })).default([]),
  imageUrls: z.string().array().optional(),
  imageUrl: z.string().optional().nullable(),
  youtubeUrl: z.string().optional().nullable(),
  publishTime: z.date().optional().nullable(),
  // https://github.com/colinhacks/zod/pull/3118
  images: z
    .instanceof(File, { message: "Please upload a file." })
    .refine((file) => !file || isFileImage(file), {
      message: "Måste vara en bild",
    })
    .array()
    .default([]),
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
    message:
      "Tags cannot be empty if you want to send a notification. No notifications will be sent",
    path: ["tags"],
  });

export const updateSchema = articleSchema.refine(
  (data) => data.sendNotification === false || data.tags.length > 0,
  {
    message:
      "Tags cannot be empty if you want to send a notification. No notifications will be sent",
    path: ["tags"],
  },
);
