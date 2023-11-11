import { z } from "zod";

export const memberSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  nickname: z.string().nullable(),
  picturePath: z.string().nullable(),
  classYear: z.number().nullable(),
  classProgramme: z.string().nullable(),
});
export const positionSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
});
export const mandateSchema = z.object({
  id: z.string().uuid(),
  position: positionSchema,
});
export const customAuthorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameEn: z.string().nullable(),
  imageUrl: z.string().nullable(),
});
export const authorSchema = z.object({
  id: z.string(),
  memberId: z.string().uuid(),
  mandateId: z.string().uuid().nullable(),
  customId: z.string().uuid().nullable(),
  type: z.string().nullable(),
  member: memberSchema,
  mandate: mandateSchema.nullable(),
  customAuthor: customAuthorSchema.nullable(),
});
export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameEn: z.string().nullable(),
  color: z.string().nullable(),
  isDefault: z.boolean().nullable(),
});
