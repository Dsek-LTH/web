import z from "zod/v4";
import dayjs from "dayjs";
import type { components } from "$lib/api/schema";

export type Ciabatta = components["schemas"]["Ciabatta"];
/** A cafe shift, always with its worker (Go joins it). */
export type ShiftWithWorker = components["schemas"]["CafeShift"];
export type OpeningHour = components["schemas"]["CafeOpeningHours"];

export const updateTimeSchema = z.object({
  markdownSlug: z.string(),
  markdownSv: z.string(),
});

export const TimeSlot = {
  DAYMANAGER: "DAYMANAGER",
  SHIFT_1: "SHIFT_1",
  SHIFT_2: "SHIFT_2",
  SHIFT_3: "SHIFT_3",
} as const;
export type TimeSlot = (typeof TimeSlot)[keyof typeof TimeSlot];

export const scheduleForm = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => dayjs(val, "YYYY-MM-DD", true).isValid(), {
      message: "Invalid date, expected format YYYY-MM-DD",
    }),
  worker: z.string().optional(),
  timeSlot: z.nativeEnum(TimeSlot),
});

export const editWeeklyCiabattaSchema = z.object({
  year: z.number(),
  week: z.number(),
  name: z.string(),
});
