import { programmes } from "$lib/utils/programmes";
import { string, z } from "zod";

export const emptySchema = z.object({}); // for forms without a body
export type EmptySchema = typeof emptySchema;

export const memberSchema = z.object({
  studentId: z.string().nullable(),
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
    .default(null),
  classProgramme: z
    .string()
    .nullable()
    .default("D")
    .refine((p) => p == null || programmes.some((c) => c.id === p), {
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
export type TagSchema = typeof tagSchema;
export const notificationSchema = z.object({
  notificationId: z.number().nullable(),
  notificationIds: z.number().array().nullable(),
});
export type NotificationSchema = typeof notificationSchema;
export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  pushNotification: z.boolean(),
});
export type SubscriptionSchema = typeof subscriptionSchema;
export const settingsSchema = z.object({
  subscribedSettings: z.array(subscriptionSchema),
  tags: z.array(tagSchema),
});
