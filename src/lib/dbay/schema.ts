import { z } from "zod";

export const dbaySchema = z.object({
  header: z.string().min(1, "Header cannot be empty"),
  body: z.string().min(1, "Body cannot be empty"),
  price: z.number().int().nonnegative(),
  email: z.string().optional(),
  phone: z.string().optional(),
  slug: z.string(),
});

//export type ArticleSchema = Infer<typeof dbaySchema>;

export const createSchema = dbaySchema.omit({ slug: true });
