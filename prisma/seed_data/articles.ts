import { Prisma } from "@prisma/client";
import members from "./members";
const articles: Prisma.ArticleCreateInput[] = [
  {
    slug: "testartikel-1",
    header: "Testartikel",
    body: "Detta är en testartikel",
    author: {
      create: {
        member: {
          connect: {
            studentId: members[0].studentId,
          },
        },
      },
    },
    likes: {
      create: [
        {
          member: {
            connect: {
              studentId: members[1].studentId,
            },
          },
        },
      ],
    },
    tags: {
      create: [
        {
          name: "Test tagg",
        },
      ],
    },
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // a week ago
  },
];

export default articles;
