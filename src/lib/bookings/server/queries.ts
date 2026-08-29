import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { error } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { zod4 } from "sveltekit-superforms/adapters";
import * as m from "$paraglide/messages";
import { bookingSchema } from "$lib/bookings/schema";
import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

dayjs.extend(utc);
dayjs.extend(timezone);

export type BookingRequestWithRelations = ExtendedPrismaModel<"BookingRequest"> & {
  bookables: Array<ExtendedPrismaModel<"Bookable">>;
  booker: ExtendedPrismaModel<"Member"> | null;
};

export async function getUpcomingBookingRequests(prisma: ExtendedPrisma) {
  return prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
      booker: true,
    },
  });
}

export async function getBookingRequestOrThrow(
  prisma: ExtendedPrisma,
  id: string,
) {
  return prisma.bookingRequest
    .findUniqueOrThrow({
      where: { id },
      include: { bookables: true, booker: true },
    })
    .catch(() => {
      throw error(404, m.booking_errors_notFound());
    });
}

export async function getSuperValidatedBookingForm(
  bookingRequest: ExtendedPrismaModel<"BookingRequest"> & {
    bookables: Array<ExtendedPrismaModel<"Bookable">>;
  },
) {
  const initialData = {
    name: bookingRequest.event ?? undefined,
    start: bookingRequest.start
      ? dayjs(bookingRequest.start)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DDTHH:mm")
      : undefined,
    end: bookingRequest.end
      ? dayjs(bookingRequest.end)
          .tz("Europe/Stockholm")
          .format("YYYY-MM-DDTHH:mm")
      : undefined,
    bookables: bookingRequest.bookables?.map((bookable) => bookable.id),
  };

  return superValidate(initialData, zod4(bookingSchema));
}
