import type { Position } from "@prisma/client";

export function sortBoardPos(
  posId1: Position["id"],
  posId2: Position["id"],
): number {
  const aIndex = boardOrder[posId1] ?? -1;
  const bIndex = boardOrder[posId2] ?? -1;
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

const boardOrder: Readonly<Record<Position["id"], number>> = [
  "dsek.ordf",
  "dsek.vice_ordf",
  "dsek.skattm.mastare",
  "dsek.infu.mastare",
  "dsek.srd.ordf",
  "dsek.cafe.mastare",
  "dsek.nari.mastare",
  "dsek.km.mastare",
  "dsek.aktu.mastare",
  "dsek.sex.mastare",
  "dsek.noll.stab.oph",
].reduce<Record<Position["id"], number>>((acc, cur, i) => {
  acc[cur] = i;
  return acc;
}, {});
