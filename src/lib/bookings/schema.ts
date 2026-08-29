import dayjs from "dayjs";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const bookingSchema = z
  .object({
    name: z.string().min(1),
    start: z
      .string()
      .refine((value) => dayjs(value).isValid(), {
        message: m.booking_errors_invalidStartDate(),
      })
      .default(() => dayjs().startOf("hour").format("YYYY-MM-DDTHH:mm")),
    end: z
      .string()
      .refine((value) => dayjs(value).isValid(), {
        message: m.booking_errors_invalidEndDate(),
      })
      .default(() => dayjs().endOf("hour").format("YYYY-MM-DDTHH:mm")),
    bookables: z.array(z.string()).min(1),
  })
  .refine((data) => dayjs(data.start).isBefore(dayjs(data.end)), {
    message: m.booking_startDateBeforeEndDate(),
    path: ["end"],
  });

export type BookingSchema = typeof bookingSchema;
