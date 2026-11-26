import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

/**
 * A photographer or editor as the album forms hold them: what
 * MemberSelector shows, from the search index or from Go (which omits unset
 * fields). Only the student id is sent to Go.
 */
export const galleryMemberSchema = z.object({
  id: z.string(),
  fullName: z.string().default(""),
  studentId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  picturePath: z.string().optional(),
  classYear: z.number().optional(),
  classProgramme: z.string().optional(),
});
export type GalleryMember = Infer<typeof galleryMemberSchema>;

/** The student ids Go takes for the album's photographers and editors. */
export const studentIds = (members: GalleryMember[]) =>
  members.flatMap((member) => (member.studentId ? [member.studentId] : []));
