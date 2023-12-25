import { PrismaClient } from "@prisma/client";
import apiNames from "../../src/lib/utils/apiNames";

export const insertAccessPolicies = async (prisma: PrismaClient) => {
  return Promise.all([
    materialBucketAccessPolicies(prisma),
    eventCommenteDelete(prisma),
    yrkaSend(prisma),
  ]);
};

const insertPolicies = async (
  prisma: PrismaClient,
  apiName: string,
  roles: string[],
) => {
  if (
    (await prisma.accessPolicy.count({
      where: {
        apiName,
        role: {
          in: roles,
        },
      },
    })) < roles.length
  ) {
    await prisma.accessPolicy.deleteMany({
      where: {
        apiName,
        role: {
          in: roles,
        },
      },
    });
    await prisma.accessPolicy.createMany({
      data: roles.map((role) => ({
        apiName,
        role,
      })),
    });
  }
};

const materialBucketAccessPolicies = async (prisma: PrismaClient) => {
  await Promise.all([
    insertPolicies(prisma, apiNames.FILES.BUCKET("material").CREATE, [
      "dsek.infu.dwww",
      "dsek.styr",
    ]),
    insertPolicies(prisma, apiNames.FILES.BUCKET("material").READ, ["*"]),
    insertPolicies(prisma, apiNames.FILES.BUCKET("material").UPDATE, [
      "dsek.infu.dwww",
      "dsek.styr",
    ]),
    insertPolicies(prisma, apiNames.FILES.BUCKET("material").DELETE, [
      "dsek.infu.dwww",
    ]),
  ]);
};

const eventCommenteDelete = async (prisma: PrismaClient) => {
  await insertPolicies(prisma, apiNames.EVENT.COMMENT_DELETE, [
    "dsek.infu.dwww",
    "dsek.infu.redaktor",
    "dsek.infu.webmaster",
    "dsek.styr",
  ]);
};

const yrkaSend = async (prisma: PrismaClient) => {
  await insertPolicies(prisma, apiNames.YRKA.SEND, ["_"]);
};
