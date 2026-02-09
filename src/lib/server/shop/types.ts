import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

export type TransactionClient = Parameters<
  Parameters<ExtendedPrisma["$transaction"]>[0]
>[0];

export type ShopIdentification =
  | {
    memberId: string;
    externalCode?: never;
  }
  | {
    memberId?: never;
    externalCode: string;
  };

export type DBShopIdentification = ReturnType<typeof dbIdentification>;
export const dbIdentification = ({
  memberId,
  externalCode,
}: ShopIdentification) =>
  memberId ? { memberId } : { externalCustomerCode: externalCode };

export const GRACE_PERIOD_WINDOW = 60 * 1000; // 1 minute
export const TIME_TO_BUY = 5 * 60 * 1000; // 5 minutes
