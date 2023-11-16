import { tagSchema } from "$lib/zod/schemas";
import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().default(""),
    description: z.string().default(""),
    shortDescription: z.string().default(""),
    link: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    organizer: z.string().default(""),
    startDatetime: z.date().default(() => new Date()),
    endDatetime: z.date().default(() => new Date(new Date().getTime() + 60 * 60 * 1000)), // one hour later
    alarmActive: z.boolean().nullable().default(null),
    tags: z.array(tagSchema).default([]),
  })
  .refine((data) => data.startDatetime < data.endDatetime, {
    message: "End must be after start",
    path: ["endDatetime"],
  });
export type EventSchema = typeof eventSchema;
