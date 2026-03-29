import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const bookings = await locals.prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: new Date(
          Temporal.Now.zonedDateTimeISO()
            .subtract({ weeks: 1 })
            .toInstant().epochMilliseconds,
        ),
      },
    },
    orderBy: [{ start: "asc" }, { end: "asc" }, { status: "asc" }],
    include: {
      booker: true,
      bookables: true,
    },
  });

  return { bookings };
};
