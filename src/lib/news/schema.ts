import { isFileImage } from "$lib/files/uploadFiles";
import { authorSchema, tagSchema } from "$lib/zod/schemas";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const articleSchema = z.object({
  slug: z.string(),
  header: z.string().min(1, "Title cannot be empty"),
  headerEn: z.string().nullable(),
  body: z.string().default(""),
  bodyEn: z.string().nullable(),
  author: authorSchema,
  tags: z
    .array(
      tagSchema.pick({
        id: true,
      }),
    )
    .default([]),
  imageUrl: z.string().optional().nullable(),
  // only for uploading files
  image: z
    .instanceof(File, { message: "Please upload a file" })
    .nullable()
    .optional()
    .refine((file) => !file || isFileImage(file), {
      message: "Måste vara en bild",
    }),
});
export type ArticleSchema = Infer<typeof articleSchema>;

export const createSchema = articleSchema
  .omit({
    slug: true,
  })
  .extend({
    notificationText: z.string().optional(),
    sendNotification: z.boolean().default(true),
  });

export const updateSchema = articleSchema;
