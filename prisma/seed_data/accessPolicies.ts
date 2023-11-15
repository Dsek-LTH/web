import { PrismaClient } from "@prisma/client";
import apiNames from "../../src/lib/utils/apiNames";

export const insertAccessPolicies = async (prisma: PrismaClient) => {
  if (
    (await prisma.accessPolicy.count({
      where: {
        apiName: apiNames.FILES.BUCKET("material").CREATE,
      },
    })) <= 0
  ) {
    await prisma.accessPolicy.createMany({
      data: [
        {
          apiName: apiNames.FILES.BUCKET("material").READ,
          role: "*",
        },
        {
          apiName: apiNames.FILES.BUCKET("material").CREATE,
          role: "dsek.infu.dwww",
        },
        {
          apiName: apiNames.FILES.BUCKET("material").CREATE,
          role: "dsek.styr",
        },
        {
          apiName: apiNames.FILES.BUCKET("material").UPDATE,
          role: "dsek.infu.dwww",
        },
        {
          apiName: apiNames.FILES.BUCKET("material").UPDATE,
          role: "dsek.styr",
        },
        {
          apiName: apiNames.FILES.BUCKET("material").DELETE,
          role: "dsek.infu.dwww",
        },
      ],
    });
  }
  if (
    (await prisma.accessPolicy.count({
      where: {
        apiName: apiNames.EVENT.COMMENT_DELETE,
      },
    })) <= 0
  ) {
    await prisma.accessPolicy.createMany({
      data: [
        {
          apiName: apiNames.EVENT.COMMENT_DELETE,
          role: "dsek.infu.dwww",
        },
        {
          apiName: apiNames.EVENT.COMMENT_DELETE,
          role: "dsek.infu.redaktor",
        },
        {
          apiName: apiNames.EVENT.COMMENT_DELETE,
          role: "dsek.infu.webmaster",
        },
        {
          apiName: apiNames.EVENT.COMMENT_DELETE,
          role: "dsek.styr",
        },
      ],
    });
  }
};
