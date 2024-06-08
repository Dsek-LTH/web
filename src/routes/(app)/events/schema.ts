import { recurringTypes } from "$lib/utils/events";
import { tagSchema } from "$lib/zod/schemas";
import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().default(""),
    description: z.string().default(""),
    shortDescription: z.string().nullable().default(null),
    link: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    organizer: z.string().default(""),
    startDatetime: z.date().default(() => new Date()),
    endDatetime: z
      .date()
      .default(() => new Date(new Date().getTime() + 60 * 60 * 1000)), // one hour later
    alarmActive: z.boolean().nullable().default(null),
    isRecurring: z.boolean().default(false),
    recurringType: z.enum(["", ...recurringTypes.keys()]).default("WEEKLY"),
    separationCount: z.number().default(0),
    recurringEndDatetime: z
      .date()
      .default(() => new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)), // one week later
    tags: z.array(tagSchema).default([]),
  })
  .refine(
    (data) =>
      data.startDatetime < data.endDatetime &&
      (!data.isRecurring || data.startDatetime < data.recurringEndDatetime),
    {
      message: "End must be after start",
      path: ["endDatetime"],
    },
  );
export type EventSchema = typeof eventSchema;
