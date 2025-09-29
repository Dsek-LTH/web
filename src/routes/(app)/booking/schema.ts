import dayjs from "dayjs";
import { z } from "zod";
import * as m from "$paraglide/messages";

export const bookingSchema = z
  .object({
    name: z.string().min(1),
    start: z
      .string()
      .default(() => dayjs().startOf("hour").format("YYYY-MM-DDTHH:mm")),
    end: z
      .string()
      .default(() => dayjs().endOf("hour").format("YYYY-MM-DDTHH:mm")),
    bookables: z.array(z.string()).min(1),
    groups: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        nameEn: z.string(),
      }),
    ),
  })
  .refine((data) => dayjs(data.start).isBefore(dayjs(data.end)), {
    message: m.booking_startDateBeforeEndDate(),
    path: ["end"],
  });

export type BookingSchema = typeof bookingSchema;
