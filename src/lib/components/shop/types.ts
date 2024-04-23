import dayjs from "dayjs";
import { z } from "zod";

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

export type TicketSchema = typeof ticketSchema;
