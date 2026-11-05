import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { groupNameSchema, isSafePathSegment } from "../groupName";

const CURRENT_YEAR = new Date().getFullYear();

export const uploadSchema = z.object({
  type: z.enum(["meeting", "srd", "requirement"]).default("meeting"),
  folder: z
    .string()
    .trim()
    .default("")
    .refine((value) => value.length > 0 && isSafePathSegment(value), {
      message: m.documents_errors_invalidFileName(),
    }),
  group: groupNameSchema.default(""),
  name: z.string().default(""),
  year: z
    .number()
    .min(1962)
    .max(CURRENT_YEAR + 1)
    .default(CURRENT_YEAR),
  file: z.instanceof(File, { message: m.documents_errors_erroneousFile() }),
});
export type UploadSchema = Infer<typeof uploadSchema>;
