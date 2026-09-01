import { programmes } from "$lib/utils/programmes";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const emptySchema = z.object({}); // for forms without a body
export type EmptySchema = Infer<typeof emptySchema>;

export const memberSchema = z.object({
  studentId: z.string().nullable(),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  nickname: z.string().nullable(),
  bio: z.string().nullish(),
  picturePath: z.string().nullable(),
  classYear: z
    .number()
    .min(1962)
    .max(new Date().getFullYear())
    .nullable()
    .default(new Date().getFullYear()),
  classProgramme: z
    .string()
    .nullable()
    .refine((p) => p == null || programmes.some((c) => c.id === p), {
      message: "Ogiltigt program",
    }),
  graduationYear: z.number().min(1962).nullable().default(null),
  foodPreference: z.string().nullable().default(null),
  nollningGroupId: z.string().uuid().nullable().default(null),
  language: z.string().nullable().default(null),
});
export const tagSchema = z.object({
  id: z.string().uuid(),
  nameSv: z.string(),
  nameEn: z.string().nullable(),
  color: z.string().nullable(),
  isDefault: z.boolean().nullable(),
});
export const notificationSchema = z.object({
  notificationId: z.number().optional(),
  notificationIds: z.number().array(),
});
export type NotificationSchema = Infer<typeof notificationSchema>;
