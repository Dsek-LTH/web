import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { prisma, user } = locals;

  const myCart = await prisma.cart.findFirst({
    where: {
      studentId: user?.studentId,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      items: {
        include: {
          productInventory: {
            include: {
              product: {
                select: {
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          productInventoryId: "desc",
        },
      },
    },
  });
  return {
    myCart,
  };
};
