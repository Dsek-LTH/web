import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const uploadSchema = z.object({
  name: z.string().default(""),
  date: z.string().default(""),
  files: z.array(
    z.instanceof(File, { message: m.documents_errors_erroneousFile() }),
  ),
});
export type UploadSchema = Infer<typeof uploadSchema>;
