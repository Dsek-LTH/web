import type { Committee, Position } from "@prisma/client";
import {
  Aktu,
  BoardOrder,
  Cafe,
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
  Trivsel,
  Valb,
} from "./enums";

export function sortBoardPos(
  posId1: Position["id"],
  posId2: Position["id"],
): number {
  // BoardOrder[posId1] is unsafe since posId1 is a string,
  // so we have to use Object.values(BoardOrder).indexOf(posId1).
  const aIndex = Object.values(BoardOrder).indexOf(posId1);
  const bIndex = Object.values(BoardOrder).indexOf(posId2);
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

export function sortCommitteePos(
  posId1: Position["id"],
  posId2: Position["id"],
  committeeShortName: NonNullable<Committee["shortName"]>,
): number {
  if (!(committeeShortName in committeeEnums)) return 0; // No committee? Preserve order
  const committee =
    committeeEnums[committeeShortName as keyof typeof committeeEnums];
  const aIndex = Object.values(committee).indexOf(posId1);
  const bIndex = Object.values(committee).indexOf(posId2);
  if (aIndex === -1) return 1; // Pos A not found? Assume pos B comes before
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
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
} as const;
