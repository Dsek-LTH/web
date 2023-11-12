import { PrismaClient } from "@prisma/client";

export const insertProducts = async (prisma: PrismaClient) => {
  await prisma.product.deleteMany({
    where: {
      productCategory: {
        name: {
          in: ["Café", "Merch"],
        },
      },
    },
  });
  await prisma.productCategory.deleteMany({
    where: {
      name: {
        in: ["Café", "Merch"],
      },
    },
  });
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

  await prisma.productCategory.create({
    data: {
      name: "Merch",
      description: "Merchandise",
      products: {
        create: {
          name: "T-shirt",
          price: 10,
          imageUrl: "https://www.wexman.se/static/webimages/original/royal_blue_tshirt_bl.jpg",
          description: "En kopp kaffe",
          maxPerUser: 1000,
          productInventories: {
            createMany: {
              data: [
                {
                  quantity: 1000,
                  variant: "S",
                },
                {
                  quantity: 1000,
                  variant: "M",
                },
                {
                  quantity: 1000,
                  variant: "L",
                },
                {
                  quantity: 1000,
                  variant: "XL",
                },
                {
                  quantity: 1000,
                  variant: "XXL",
                },
              ],
            },
          },
        },
      },
    },
  });
};
