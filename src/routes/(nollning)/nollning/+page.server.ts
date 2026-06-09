export const load = async ({ locals }) => {
  const { prisma } = locals;
  const mentorGroups = await prisma.mentorGroup.findMany({
    where: {
      year: 2025,
    },
    include: {
      mentees: true,
      mentors: {
        include: {
          member: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return {
    mentorGroups,
  };
};
