import { tagSchema } from "$lib/zod/schemas";
import { z } from "zod";
import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms";
import { isFileImage } from "$lib/files/utils";
import { recurringTypesList, recurringTypeValues } from "$lib/utils/events"; // we cannot use the enum from @prisma/client due to vite not supporting enums in client code

export const eventSchema = z
  .object({
    title: z.string(),
    titleEn: z.string().nullable(),
    description: z.string().default(""),
    descriptionEn: z.string().nullable(),
    shortDescription: z.string().nullable().default(null),
    shortDescriptionEn: z.string().nullable().default(null),

    link: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    organizer: z.string().default(""),

    startDatetime: z.date().default(() => new Date()),
    endDatetime: z
      .date()
      .default(() => new Date(new Date().getTime() + 60 * 60 * 1000)), // one hour later

    imageUrl: z.string().optional().nullable(),
    // only for uploading files
    image: z
      .instanceof(File, { message: "Please upload a file" })
      .nullable()
      .optional()
      .refine((file) => !file || isFileImage(file), {
        message: "Måste vara en bild",
      }),

    tags: z
      .array(
        tagSchema.pick({
          id: true,
        }),
      )
      .default([]),

    alarmActive: z.boolean().nullable().default(null),
    isRecurring: z.boolean().default(false),
    // see comment above and in utils/events.ts why we do it like this
    recurringType: z
      .enum([recurringTypesList[0]!, ...recurringTypesList.slice(1)]) // type is [string, ...string[]]
      .default(recurringTypeValues.WEEKLY),
    separationCount: z.number().default(0),
    recurringEndDatetime: z
      .date()
      .default(() => new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)), // one week later
  })
  .refine((data) => data.startDatetime < data.endDatetime, {
    message: m.events_errors_endAfterStart(),
    path: ["endDatetime"],
  })
  .refine(
    (data) =>
      !data.isRecurring || data.startDatetime < data.recurringEndDatetime,
    {
      message: m.events_errors_endAfterStart(),
      path: ["recurringEndDatetime"],
    },
  );
export type EventSchema = Infer<typeof eventSchema>;

export const interestedGoingSchema = z.object({
  eventId: z.string(),
});
export const actionType = z.enum(["THIS", "FUTURE", "ALL"]);

export type InterestedGoingSchema = Infer<typeof interestedGoingSchema>;
