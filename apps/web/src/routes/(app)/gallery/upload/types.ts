import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { galleryMemberSchema } from "../memberSchema";

export const uploadSchema = z.object({
  title: z.string().default(""),
  date: z.date({ message: m.gallery_errors_invalidDate() }).default(new Date()),
  description: z.string().optional(),
  coverFile: z
    .instanceof(File, { message: m.documents_errors_erroneousFile() })
    .optional(),
  albumFiles: z.array(
    z.instanceof(File, { message: m.documents_errors_erroneousFile() }),
  ),
  photographers: z.array(galleryMemberSchema),
  editors: z.array(galleryMemberSchema),
});

export type { GalleryMember as SmallMemberSchema } from "../memberSchema";
export type UploadSchema = Infer<typeof uploadSchema>;
