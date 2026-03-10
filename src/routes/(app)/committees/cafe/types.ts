import { Prisma, TimeSlot } from "@prisma/client";
import { z } from "zod";
export const scheduleForm = z.object({
  date: z.date(),
  worker: z.string().optional(),
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
