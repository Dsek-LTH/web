import { error } from "@sveltejs/kit";
import dayjs from "dayjs";

export const load = async (event) => {
  const { prisma, user } = event.locals;
  const bookables = await prisma.bookable.findMany();
  const bookingRequests = await prisma.bookingRequest.findMany({
    where: {
      bookerId: user.memberId,
      end: {
        gte: dayjs().subtract(1, "week").toDate(),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      bookables: true,
    },
  });

  return { bookingRequests, bookables };
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
