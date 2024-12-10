import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import type { Member } from "@prisma/client";
import { COST_CENTERS } from "./config";

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 week
const CACHED_SIGNERS: Record<string, Member["id"] | undefined> = {};
let CACHE_UPDATED_AT = 0;

const TREASURER = "dsek.skattm.mastare";
const PRESIDENT = "dsek.ordf";

export const updateSignersCacheIfNecessary = async () => {
  if (CACHE_UPDATED_AT + CACHE_TTL >= Date.now()) return;
  const allSigners = new Set([
    ...COST_CENTERS.map((center) => center.signer),
    TREASURER,
    PRESIDENT,
  ]);
  const signers = await authorizedPrismaClient.mandate.findMany({
    where: {
      positionId: {
        in: [...allSigners],
      },
      startDate: {
        lte: new Date(),
      },
      endDate: {
        gte: new Date(),
      },
    },
    select: {
      positionId: true,
      memberId: true,
    },
  });
  CACHE_UPDATED_AT = Date.now();
  signers.forEach((signer) => {
    CACHED_SIGNERS[signer.positionId] = signer.memberId;
  });
  return signers;
};

/**
 * Assumes cache is updated, gets the member id for a signer positionId
 */
export const getSigner = (signer: string) => {
  if (signer in CACHED_SIGNERS) {
    return CACHED_SIGNERS[signer]!;
  }
  return undefined; // might be a vacant position
};

/**
 * In our policy we have a logic which desides how to handle edge cases where the signer is vacant, or the signer is also the user creating the expense.
 * This method resolves said logic (or throws if impossible, which would be really rare).
 */
export const resolveSignerLogic = (
  signer: string | undefined,
  userMemberId: string,
  costCenterName: string,
) => {
  if (signer !== userMemberId && signer !== undefined) return signer;

  // user is signer, or signer is vacant
  signer = getSigner(TREASURER);
  if (signer !== userMemberId && signer !== undefined) return signer;

  // user is TREASURER, or treasurer is vacant
  signer = getSigner(PRESIDENT);
  if (signer !== userMemberId && signer !== undefined) return signer;
  // user is PRESIDENT AND TREASURER (OR: President is vacant, user is treasurer, OR: treasurer is vacant and user is president)
  throw new Error(
    `Signer logic could not be resolved for cost center ${costCenterName}. Treasurer: ${getSigner(TREASURER)}, President: ${getSigner(PRESIDENT)}, User: ${userMemberId}`,
  );
};
