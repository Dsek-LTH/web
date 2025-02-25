import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const createDbaySchema = z.object({
  header: z.string().min(1, "Header cannot be empty"),
  body: z.string().min(1, "Body cannot be empty"),
  price: z.number().int().nonnegative(),
});

export type createDbaySchema = Infer<typeof createDbaySchema>;
