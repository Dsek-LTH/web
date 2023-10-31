import { Prisma } from "@prisma/client";

const currentYear = new Date().getFullYear();
const members = [
  {
    studentId: "lu4185sv-s",
    firstName: "Ludvig",
    lastName: "Svedberg",
    picturePath: "https://i.pravatar.cc/?u=lund@student",
    mandates: {
      create: [
        {
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.ordf",
            },
          },
        },
        {
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
        {
          startDate: new Date(`${currentYear - 1}-01-01`),
          endDate: new Date(`${currentYear - 1}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
      ],
    },
  },
  {
    studentId: "ol0000le-s",
    firstName: "Oliver",
    lastName: "Levay",
    picturePath: "https://i.pravatar.cc/?u=lund@student",
    mandates: {
      create: [
        {
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
        {
          startDate: new Date(`${currentYear - 2}-01-01`),
          endDate: new Date(`${currentYear - 2}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
      ],
    },
  },
  {
    studentId: "ad2313ad-s",
    firstName: "Daniel",
    lastName: "Adu-Gyan",
    picturePath: "https://i.pravatar.cc/?u=lund@student",
    mandates: {
      create: [
        {
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mastare",
            },
          },
        },
      ],
    },
  },
] satisfies Prisma.MemberCreateInput[];

export default members;
