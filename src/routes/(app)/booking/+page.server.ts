import apiNames from "$lib/utils/apiNames";
import * as m from "$paraglide/messages";
import { isAuthorized } from "$lib/utils/authorization";
import { redirect } from "$lib/utils/redirect";
import { error } from "@sveltejs/kit";

export const load = async (event) => {
  const { prisma, user } = event.locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    where: {
      bookerId: user.memberId,
    },
    include: {
      bookables: true,
    },
  });

  if (bookingRequests.length === 0) {
    const isAdmin = isAuthorized(apiNames.BOOKINGS.UPDATE, user);
    if (isAdmin) {
      return redirect(
        "/booking/admin",
        {
          message: m.booking_noBookings(),
          type: "info",
        },
        event,
      );
    }
    redirect(
      "/booking/create",
      {
        message: m.booking_noBookings(),
        type: "info",
      },
      event,
    );
  }

  return { bookingRequests };
};

export const actions = {
  delete: async ({ request, locals }) => {
    const { prisma } = locals;
    const formData = await request.formData();
    const id = formData.get("id");
    if (id && typeof id === "string") {
      await prisma.bookingRequest.delete({
        where: { id },
      });
    } else {
      error(422, "Invalid booking request id");
    }
  },
};
