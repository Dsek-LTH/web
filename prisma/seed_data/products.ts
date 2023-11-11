import { PrismaClient } from "@prisma/client";

export const insertProducts = async (prisma: PrismaClient) => {
  const count = await prisma.product.count({
    where: {
      deletedAt: null,
    },
  });
  if (count > 0) return;
  await prisma.productCategory.create({
    data: {
      name: "Café",
      description: "Kaffe och fika",
      products: {
        create: {
          name: "Kaffe",
          price: 10,
          imageUrl:
            "https://www.arvidnordquist.se/siteassets/kaffe/kafferecept/kaffe-latte/foto_petrus_iggstrom-5555_latte2.jpg",
          description: "En kopp kaffe",
          maxPerUser: 1000,
          productInventories: {
            create: {
              quantity: 1000,
            },
          },
        },
      },
    },
  });
};
