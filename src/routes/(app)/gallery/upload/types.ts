import { memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const uploadSchema = z.object({
  title: z.string().default(""),
  date: z.string().default(""),
  coverFile: z
    .instanceof(File, { message: m.documents_errors_erroneousFile() })
    .optional(),
  albumFiles: z.array(
    z.instanceof(File, { message: m.documents_errors_erroneousFile() }),
  ),
  photographers: z.array(memberSchema),
  editors: z.array(memberSchema),
});
export type UploadSchema = Infer<typeof uploadSchema>;
