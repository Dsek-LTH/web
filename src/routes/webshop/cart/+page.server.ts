import prisma from "$lib/utils/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();

  const myCart = await prisma.cart.findFirst({
    where: {
      studentId: session?.user?.student_id,
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
