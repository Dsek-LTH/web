import { z } from "zod";
import * as m from "$paraglide/messages";

// start/end are z.date() (not the old z.string() + server-side dayjs.tz
// conversion) to match $lib/events/schema.ts's own pattern - the browser
// parses a datetime-local input as a local wall-clock Date, and
// .toISOString() at the call site turns that into an unambiguous UTC
// instant with no explicit Stockholm-timezone handling needed here.
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
    accessDoors: z.array(z.string()).default([]),
    accessMemberIds: z.array(z.uuid()).default([]),
  })
  .refine((data) => data.start < data.end, {
    message: m.booking_startDateBeforeEndDate(),
    path: ["end"],
  });

export type BookingSchema = typeof bookingSchema;
