import type { Actions, PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
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
    const bookingRequest = await prisma.bookingRequest.update({
      where: {
        id: formData.get("id") as string,
      },
      data: {
        status: "APPROVED",
      },
    });
  },
  reject: async (event) => {
    const { request, locals } = event;
    const { prisma } = locals;
    const formData = await request.formData();
    const bookingRequest = await prisma.bookingRequest.update({
      where: {
        id: formData.get("id") as string,
      },
      data: {
        status: "REJECTED",
      },
    });
  },
};
