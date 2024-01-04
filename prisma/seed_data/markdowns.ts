import { PrismaClient } from "@prisma/client";

export const insertMarkdowns = async (prisma: PrismaClient) => {
  await prisma.markdown.upsert({
    where: { name: "cafe:open" },
    create: {
      name: "cafe:open",
      markdown: "11:30 - 13:00",
    },
    update: {},
  });
};
