import { programmes } from "$lib/utils/programmes";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { QuestionType } from "$lib/utils/shop/types";
import dayjs from "dayjs";

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
export const notificationSchema = z.object({
  notificationId: z.number().nullable(),
  notificationIds: z.number().array().nullable(),
});
export type NotificationSchema = Infer<typeof notificationSchema>;

export const ticketSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty"),
    titleEn: z.string().nullable().optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .nullable()
      .optional(),
    descriptionEn: z.string().nullable().optional(),
    // price is in SEK, with a maximum of two decimals
    price: z.number().gte(0),
    availableFrom: z.date(),
    availableTo: z.date().nullable().optional(), // cannot be before availableFRom
    eventId: z.string().uuid(),
    stock: z.number().int("Stock must be an integer").gte(0),
    maxAmountPerUser: z
      .number()
      .int("Max amount per user must be an integer")
      .positive()
      .optional(),
    questions: z.array(
      z
        .object({
          id: z.string().uuid().optional(),
          title: z.string().min(1, "Title cannot be empty"),
          titleEn: z.string().nullable().optional(),
          description: z.string().default(""),
          descriptionEn: z.string().nullable().optional(),
          // type can be any of "multple-choice" or "text"
          type: z.nativeEnum(QuestionType).default(QuestionType.Text),
          forExternalsOnly: z.boolean().default(false),
          options: z
            .array(
              z.object({
                answer: z.string().min(1, "Answer cannot be empty"),
                answerEn: z.string().nullable().optional(),
                extraPrice: z.number().int().default(0).nullable(),
              }),
            )
            .optional(),
        })
        .refine(
          (arg) =>
            arg.type !== QuestionType.MultipleChoice ||
            arg.options !== undefined,
          {
            message: "Multiple choice questions must have options",
            path: ["type"],
          },
        ),
    ),
  })
  .refine(
    (data) =>
      !data.availableTo ||
      dayjs(data.availableFrom).isBefore(dayjs(data.availableTo)),
    {
      message: "Available from must be before available to",
      path: ["availableTo"],
    },
  );

export type TicketSchema = Infer<typeof ticketSchema>;
