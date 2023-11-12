import { authorSchema, tagSchema } from "$lib/zod/schemas";
import { z } from "zod";

export const articleSchema = z.object({
  header: z.string().default(""),
  body: z.string().default(""),
  author: authorSchema,
  tags: z.array(tagSchema).default([]),
});
export type ArticleSchema = typeof articleSchema;
