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
    start: z.date().default(() => new Date()),
    end: z.date().default(() => new Date(new Date().getTime() + 60 * 60 * 1000)),
    bookables: z.array(z.string()).min(1),
  })
  .refine((data) => data.start < data.end, {
    message: m.booking_startDateBeforeEndDate(),
    path: ["end"],
  });

export type BookingSchema = typeof bookingSchema;
