import { z } from "zod";
import { classProgrammes } from "../../routes/members/[studentId]/data";

export const memberSchema = z.object({
  studentId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  nickname: z.string().nullable(),
  bio: z.string().nullish(),
  picturePath: z.string().nullable(),
  classYear: z.number().min(1962).max(new Date().getFullYear()).nullable().default(null),
  classProgramme: z
    .string()
    .nullable()
    .default("D")
    .refine((p) => p == null || classProgrammes.some((c) => c.id === p), {
      message: "Ogiltigt program",
    }),
  foodPreference: z.string().nullable().default(null),
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
