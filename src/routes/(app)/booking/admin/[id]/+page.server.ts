import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import {
  actions,
  getAllBookingRequestsWeekly,
  getBookingRequestOrThrow,
  getSuperValidatedForm,
} from "../sharedUtils";

export const load = async ({ locals, params }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);
  const bookables = await prisma.bookable.findMany();

  const allBookingRequests = await prisma.bookingRequest.findMany({
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
    bookingRequests: await getAllBookingRequestsWeekly(prisma),
  };
};

export { actions };
