import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import dayjs from "dayjs";
import {
  actions,
  getBookingRequestOrThrow,
  getSuperValidatedForm,
  getUpcomingBookingRequests,
} from "../../utils";

export const load = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);
  const bookables = await prisma.bookable.findMany();

  const allBookingRequests = await prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
    },
  });

  const bookingRequest = await getBookingRequestOrThrow(prisma, params.id);
  const form = await getSuperValidatedForm(bookingRequest);

  return {
    bookables,
    form,
    booking: bookingRequest,
    allBookingRequests,
    bookingRequests: await getUpcomingBookingRequests(prisma),
  };
};

export { actions };
