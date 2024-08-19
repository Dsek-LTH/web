import dayjs from "dayjs";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export enum QuestionType {
  MultipleChoice = "multiple-choice",
  Text = "text",
}

export const questionForm = z.object({
  consumableId: z.string(),
  questionId: z.string(),
  answer: z.string(),
});
export type QuestionForm = Infer<typeof questionForm>;

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
          id: z.string().uuid().optional().nullable(),
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

export type * from "$lib/server/shop/cart/types";
