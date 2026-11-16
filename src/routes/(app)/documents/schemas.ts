import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

/**
 * Shared shape for the delete-file forms. The documents page extends this
 * with the bucket a file lives in; the requirements and governing-document
 * pages use it as-is.
 */
export const deleteFileSchema = z.object({
  id: z.string(),
});

export type DeleteFileSchema = Infer<typeof deleteFileSchema>;
