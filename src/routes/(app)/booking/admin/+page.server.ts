import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    where: {
      start: {
        gte: new Date(),
      },
    },
    include: {
      bookables: true,
    },
  });

  return { bookingRequests };
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
