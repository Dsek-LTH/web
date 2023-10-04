import { Prisma } from "@prisma/client";

const currentYear = new Date().getFullYear();
const members: Prisma.MemberCreateInput[] = [
  {
    studentId: "lu4185sv-s",
    firstName: "Ludvig",
    lastName: "Svedberg",
    mandates: {
      create: [
        {
          start: new Date(`${currentYear}-01-01`),
          end: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.ordf",
            },
          },
        },
        {
          start: new Date(`${currentYear}-01-01`),
          end: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
        {
          start: new Date(`${currentYear - 1}-01-01`),
          end: new Date(`${currentYear - 1}-12-31`),
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
    mandates: {
      create: [
        {
          start: new Date(`${currentYear}-01-01`),
          end: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mdlm",
            },
          },
        },
        {
          start: new Date(`${currentYear - 2}-01-01`),
          end: new Date(`${currentYear - 2}-12-31`),
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
    studentId: "da0000ad-s",
    firstName: "Daniel",
    lastName: "Adu-Gyan",
    mandates: {
      create: [
        {
          start: new Date(`${currentYear}-01-01`),
          end: new Date(`${currentYear}-12-31`),
          position: {
            connect: {
              id: "dsek.infu.dwww.mastare",
            },
          },
        },
      ],
    },
  },
];

export default members;
