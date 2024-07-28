import * as m from "$paraglide/messages";
import { type Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable(),
  image: z
    .instanceof(File, { message: "Please upload a file" })
    .optional()
    .refine((file) => !file || file.type === "image/svg+xml", {
      message: m.committees_errors_imageMustBeSVG(),
    }),
  markdown: z.string().optional(),
  markdownSlug: z.string().optional(),
});

export type UpdateSchema = Infer<typeof updateSchema>;
