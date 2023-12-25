import prisma from "$lib/utils/prisma";
import type { Bookable, BookingRequest } from "@prisma/client";

export const getAllBookingRequests = async (): Promise<
  (BookingRequest & { bookables: Bookable[] })[]
> => {
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });
  return bookingRequests;
};
