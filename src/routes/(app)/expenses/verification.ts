import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import { COST_CENTERS } from "./config";

/**
 * Verifies that the hard coded data in expenses config (cost centers) is correct and exists in the database.
 * If not, it will print an error
 */
export const verifyCostCenterData = async () => {
  const prisma = authorizedPrismaClient;
  const results = await Promise.allSettled(
    COST_CENTERS.map(async (center) => {
      await prisma.committee
        .findFirstOrThrow({
          where: {
            shortName: center.committee,
          },
        })
        .catch(() => {
          throw new Error(
            `Cost center ${center.name} error: Committee not found: ${center.committee}`,
          );
        });
      await prisma.position
        .findFirstOrThrow({
          where: {
            id: center.signer,
          },
        })
        .catch(() => {
          throw new Error(
            `Cost center ${center.name} error: Signer not found: ${center.signer}`,
          );
        });
    }),
  );
  const errors = results
    .filter((result) => result.status === "rejected")
    .map((result) => `${result.reason}`);
  if (errors.length > 0) {
    console.error(`ERROR WITH EXPENSE COST CENTERS`, errors.join("\n"));
  }
};
