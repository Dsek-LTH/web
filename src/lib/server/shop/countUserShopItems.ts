import { dbIdentification } from "$lib/server/shop/types";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";

export type UserShopItemCounts = ReturnType<typeof countUserShopItems>;

export const countUserShopItems = async (
  prisma: PrismaClient,
  user: AuthUser,
) => {
  if (!user) return;
  if (!user.memberId && !user.externalCode) return;
  // const identification = dbIdentification({ memberId: "is3366ka-s" });
  const unconsumed = 0;
  const inCart = 0;
  const reserved = 0;

  return {
    unconsumed,
    inCart,
    reserved,
  };
};
