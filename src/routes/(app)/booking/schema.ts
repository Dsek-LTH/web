import dayjs from "dayjs";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const bookingSchema = z
  .object({
    name: z.string().min(1),
    start: z.string().default(() => dayjs().format("YYYY-MM-DDTHH:MM")),
    end: z.string().default(() => dayjs().format("YYYY-MM-DDTHH:MM")),
    bookables: z.array(z.string()).min(1),
  })
  .refine((data) => dayjs(data.start).isBefore(dayjs(data.end)), {
    message: m.booking_startDateBeforeEndDate(),
    path: ["end"],
  });

export type BookingSchema = typeof bookingSchema;
