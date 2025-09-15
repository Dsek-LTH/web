import {
  Aktu,
  BoardOrder,
  Cafe,
  Cpu,
  Dchip,
  Fram,
  Infu,
  Km,
  Medalj,
  Naru,
  Nollu,
  Other,
  Sexm,
  Skattm,
  Srd,
  Tackm,
  Trivsel,
  Valb,
} from "./enums";
import in_ from "../in";
import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

function comparePositions(
  posId1: ExtendedPrismaModel<"Position">["id"],
  posId2: ExtendedPrismaModel<"Position">["id"],
  orderTable: object,
): number {
  // Preserve order if at least one position order is not defined
  if (!in_(posId1, orderTable) || !in_(posId2, orderTable)) return 0;
  const aIndex = orderTable[posId1];
  const bIndex = orderTable[posId2];
  // Preserve order if orderTable does not map positions to indices
  if (typeof aIndex !== "number" || typeof bIndex !== "number") return 0;
  return aIndex - bIndex;
}

export function compareBoardPositions(
  posId1: ExtendedPrismaModel<"Position">["id"],
  posId2: ExtendedPrismaModel<"Position">["id"],
): number {
  return comparePositions(posId1, posId2, BoardOrder);
}

export function compareCommitteePositions(
  posId1: ExtendedPrismaModel<"Position">["id"],
  posId2: ExtendedPrismaModel<"Position">["id"],
  committeeShortName: NonNullable<
    ExtendedPrismaModel<"Committee">["shortName"]
  >,
): number {
  if (!in_(committeeShortName, committeeEnums)) return 0; // No committee? Preserve order
  const committee = committeeEnums[committeeShortName];
  return comparePositions(posId1, posId2, committee);
}

const committeeEnums = {
  other: Other,
  skattm: Skattm,
  infu: Infu,
  srd: Srd,
  cafe: Cafe,
  naru: Naru,
  km: Km,
  aktu: Aktu,
  sexm: Sexm,
  nollu: Nollu,
  fram: Fram,
  dchip: Dchip,
  medalj: Medalj,
  trivsel: Trivsel,
  valb: Valb,
  tackm: Tackm,
  cpu: Cpu,
} as const;
