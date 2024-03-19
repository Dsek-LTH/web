export const load = async ({ locals }) => {
  const { prisma } = locals;
  const bookingRequests = await prisma.bookingRequest.findMany({
    include: {
      bookables: true,
    },
  });

  return { bookingRequests };
};
