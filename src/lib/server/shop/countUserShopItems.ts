import { dbIdentification } from "$lib/server/shop/types";
import type { PrismaClient } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";

export type UserShopItemCounts = Awaited<ReturnType<typeof countUserShopItems>>;
export const countUserShopItems = async (
  prisma: PrismaClient,
  user: AuthUser,
) => {
  if (!user) return;
  if (!user.memberId && !user.externalCode) return;
  const identification = dbIdentification(
    user.memberId
      ? { memberId: user.memberId }
      : { externalCode: user.externalCode! },
  );
  const unconsumed = await prisma.consumable.count({
    where: {
      purchasedAt: { not: null },
      consumedAt: null,
      ...identification,
    },
  });
  const inCart = await prisma.consumable.count({
    where: {
      purchasedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...identification,
    },
  });
  const reserved = await prisma.consumableReservation.count({
    where: {
      ...identification,
    },
  });

  return {
    unconsumed,
    inCart,
    reserved,
  };
};
