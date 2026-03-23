import { Prisma } from "@prisma/client";
import { TimeSlot as PrismaTimeSlot } from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";
export type { CiabattaOfTheWeek as Ciabatta } from "@prisma/client";

export const TimeSlot = {
  DAYMANAGER: "DAYMANAGER",
  SHIFT_1: "SHIFT_1",
  SHIFT_2: "SHIFT_2",
  SHIFT_3: "SHIFT_3",
} as const satisfies Record<string, PrismaTimeSlot>;
export type TimeSlot = (typeof TimeSlot)[keyof typeof TimeSlot];

export const scheduleForm = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((val) => dayjs(val, "YYYY-MM-DD", true).isValid(), {
      message: "Invalid date, expected format YYYY-MM-DD",
    }), worker: z.string().optional(),
  timeSlot: z.nativeEnum(TimeSlot),
});

export const editWeeklyCiabattaSchema = z.object({
  year: z.number(),
  week: z.number(),
  name: z.string(),
});

export type ShiftWithWorker = Prisma.CafeShiftGetPayload<{
  include: { worker: true };
}>;
