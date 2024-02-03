import apiNames from "$lib/utils/apiNames";
import { PrismaClient } from "@prisma/client";

export const insertAccessPolicies = async (prisma: PrismaClient) => {
  return Promise.all([
    materialBucketAccessPolicies(prisma),
    eventCommenteDelete(prisma),
    yrkaSend(prisma),
    song(prisma),
    emailAlias(prisma),
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

const song = async (prisma: PrismaClient) => {
  await Promise.all([
    insertPolicies(prisma, apiNames.SONG.CREATE, [
      "dsek.infu.mastare",
      "dsek.infu.arkivarie",
    ]),
    insertPolicies(prisma, apiNames.SONG.READ, ["*"]),
    insertPolicies(prisma, apiNames.SONG.UPDATE, [
      "dsek.infu.mastare",
      "dsek.infu.arkivarie",
    ]),
    insertPolicies(prisma, apiNames.SONG.DELETE, [
      "dsek.infu.mastare",
      "dsek.infu.arkivarie",
    ]),
  ]);
};

const emailAlias = async (prisma: PrismaClient) => {
  await Promise.all([
    insertPolicies(prisma, apiNames.EMAIL_ALIAS.CREATE, ["dsek.infu.dwww"]),
    insertPolicies(prisma, apiNames.EMAIL_ALIAS.READ, ["dsek.infu.dwww"]),
    insertPolicies(prisma, apiNames.EMAIL_ALIAS.UPDATE, ["dsek.infu.dwww"]),
    insertPolicies(prisma, apiNames.EMAIL_ALIAS.DELETE, ["dsek.infu.dwww"]),
  ]);
};
