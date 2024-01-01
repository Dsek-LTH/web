import { PrismaClient } from "@prisma/client";

export const insertMarkdowns = async (prisma: PrismaClient) => {
  await prisma.markdown.delete({ where: { name: "cafe:hours" } });
  await prisma.markdown.create({
    data: {
      name: "cafe:open",
      markdown: "11:30 - 13:00",
    },
  });
};
