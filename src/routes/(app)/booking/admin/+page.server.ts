import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import type { Member } from "@prisma/client";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const bookingRequests = await prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: new Date(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
    },
  });

  type AugmentedBookingRequest = Array<
    (typeof bookingRequests)[number] & { booker?: Member | null }
  >;
  const bookingRequestsWithBooker: AugmentedBookingRequest = [];

  for (const bookingRequest of bookingRequests) {
    const id = bookingRequest.bookerId;
    if (id) {
      const booker = await prisma.member.findUnique({ where: { id } });
      bookingRequestsWithBooker.push({ ...bookingRequest, booker });
    } else {
      bookingRequestsWithBooker.push(bookingRequest);
    }
  }

  return { bookingRequests: bookingRequestsWithBooker };
};

export const actions: Actions = {
  accept: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const formData = await request.formData();
    const id = formData.get("id");
    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: { id },
        data: {
          status: "ACCEPTED",
        },
      });
    }
  },
  reject: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const formData = await request.formData();
    const id = formData.get("id");
    if (id && typeof id === "string") {
      await prisma.bookingRequest.update({
        where: { id },
        data: {
          status: "DENIED",
        },
      });
    }
  },
};
