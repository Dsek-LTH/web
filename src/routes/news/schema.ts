import { authorSchema, tagSchema } from "$lib/zod/schemas";
import { z } from "zod";

export const articleSchema = z.object({
  header: z.string(),
  body: z.string(),
  author: authorSchema,
  tags: z.array(tagSchema),
});
export type ArticleSchema = typeof articleSchema;
