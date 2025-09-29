import { dbIdentification } from "$lib/server/shop/types";
import type { AuthUser } from "@zenstackhq/runtime";
import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

export type UserShopItemCounts = ReturnType<typeof countUserShopItems>;

export const countUserShopItems = (prisma: ExtendedPrisma, user: AuthUser) => {
  if (!user) return;
  if (!user.memberId && !user.externalCode) return;
  const identification = dbIdentification(
    user.memberId
      ? { memberId: user.memberId }
      : { externalCode: user.externalCode! },
  );
  const unconsumed = prisma.consumable.count({
    where: {
      purchasedAt: { not: null },
      consumedAt: null,
      ...identification,
    },
  });
  const inCart = prisma.consumable.count({
    where: {
      purchasedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...identification,
    },
  });
  const reserved = prisma.consumableReservation.count({
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
