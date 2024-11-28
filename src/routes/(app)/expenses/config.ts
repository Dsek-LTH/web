export const COST_CENTERS = [
  {
    name: "SEX01",
    description: "Funktionärer",
    example: "Mötesmat, arbetskläder, tack",
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
  {
    name: "SEX02",
    description: "Sittningar",
    example: "Mat, dekorationer, alkoholfria ingredienser",
    signer: "dsek.sex.mastare",
    committee: "sexm",
  },
] as const;

export type CostCenter = (typeof COST_CENTERS)[number];
export type CostCenterName = (typeof COST_CENTERS)[number]["name"];

export const COST_CENTER_MAP = COST_CENTERS.reduce(
  (acc, cur) => {
    acc[cur.name] = cur;
    return acc;
  },
  {} as Record<CostCenterName, CostCenter>,
);
export const isValidCostCenter = (costCenterName: string) => {
  return costCenterName in COST_CENTER_MAP;
};

export const getCostCenter = (costCenterName: string) => {
  const center = COST_CENTER_MAP[costCenterName as CostCenterName];
  if (!center) throw new Error("Cost center not found");
  return center;
};
