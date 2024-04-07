import { PrismaClient } from "@prisma/client";

export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

export type ShopIdentification =
  | {
      memberId: string;
      externalCode?: undefined;
    }
  | {
      memberId?: undefined;
      externalCode: string;
    };

export const dbIdentification = ({
  memberId,
  externalCode,
}: ShopIdentification) =>
  memberId ? { memberId } : { externalCustomerCode: externalCode };

export const RESERVATION_WINDOW = 60 * 1000; // 1 minute
export const TIME_TO_BUY = 5 * 60 * 1000; // 5 minutes
