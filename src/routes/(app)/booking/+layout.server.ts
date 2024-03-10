export const load = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });
  const bookables = await prisma.bookable.findMany();

  return { bookingRequests, bookables };
};
