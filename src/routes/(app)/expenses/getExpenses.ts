export const expensesInclusion = {
  member: {
    select: {
      firstName: true,
      lastName: true,
      picturePath: true,
    },
  },
  items: {
    include: {
      signer: {
        select: {
          firstName: true,
          lastName: true,
          picturePath: true,
        },
      },
      signedBy: {
        select: {
          firstName: true,
          lastName: true,
          picturePath: true,
        },
      },
    },
  },
};
