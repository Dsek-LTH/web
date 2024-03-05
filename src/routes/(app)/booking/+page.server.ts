import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });
  const bookables = await prisma.bookable.findMany();

  return { bookingRequests, bookables };
};

export const actions: Actions = {
  default: async (event) => {
    const { request, locals } = event;
    const { prisma, user } = locals;
    const data = await request.formData();
    const bookables: string[] = (data.get("bookables") as string).split(",");
    console.log(bookables);

    await prisma.bookingRequest.create({
      data: {
        bookerId: user?.memberId,
        start: new Date(data.get("start") as string),
        end: new Date(data.get("end") as string),
        event: data.get("event") as string,
        bookables: {
          connect: bookables.map((bookable) => ({
            id: bookable, // TODO: send in filtered bookings from client
          })),
        },
        status: "PENDING",
      },
    });
  },
};
