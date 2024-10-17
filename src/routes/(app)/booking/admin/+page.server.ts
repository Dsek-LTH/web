import apiNames from "$lib/utils/apiNames";
import { authorize } from "$lib/utils/authorization";
import dayjs from "dayjs";
import type { PageServerLoad } from "./$types";
import { actions } from "./sharedActions";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;
  authorize(apiNames.BOOKINGS.UPDATE, user);

  const bookingRequests = await prisma.bookingRequest.findMany({
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
  return { bookingRequests };
};

export { actions };
