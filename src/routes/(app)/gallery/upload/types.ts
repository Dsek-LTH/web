import { memberSchema } from "$lib/zod/schemas";
import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

const smallMemberSchema = memberSchema
  .pick({
    studentId: true,
    firstName: true,
    lastName: true,
    nickname: true,
    picturePath: true,
    classYear: true,
    classProgramme: true,
  })
  .extend({
    fullName: z.string().optional().default(""),
  });

export const uploadSchema = z.object({
  title: z.string().default(""),
  date: z
    .date({ message: m.gallery_upload_errors_invalidDate() })
    .default(new Date()),
  description: z.string().optional(),
  coverFile: z
    .instanceof(File, { message: m.documents_errors_erroneousFile() })
    .optional(),
  albumFiles: z.array(
    z.instanceof(File, { message: m.documents_errors_erroneousFile() }),
  ),
  photographers: z.array(smallMemberSchema),
  editors: z.array(smallMemberSchema),
});

export type SmallMemberSchema = Infer<typeof smallMemberSchema>;
export type UploadSchema = Infer<typeof uploadSchema>;
