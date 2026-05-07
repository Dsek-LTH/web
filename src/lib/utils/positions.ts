export const positionToCommitteeMap = {
  // This maps the names used in position ids to the shortNames used for the committees
  aktu: "aktu",
  cafe: "cafe",
  cpu: "cpu",
  fram: "fram",
  infu: "infu",
  km: "km",
  medalj: "medalj",
  noll: "nollu",
  nari: "naru",
  sex: "sexm",
  skattm: "skattm",
  srd: "srd",
  tackm: "tackm",
  triv: "trivsel",
  val: "valb",
};

export const committeeToPositionMap = {
  // This maps the shortNames used for the committees to the names in position ids
  aktu: "aktu",
  cafe: "cafe",
  cpu: "cpu",
  fram: "fram",
  infu: "infu",
  km: "km",
  medalj: "medalj",
  nollu: "noll",
  naru: "nari",
  sexm: "sex",
  skattm: "skattm",
  srd: "srd",
  tackm: "tackm",
  trivsel: "triv",
  valb: "val",
};

export const getPositionLink = (positionId: string) => {
  const parts = positionId.split(".");
  if (
    parts.length > 2 &&
    parts[0] == "dsek" &&
    Object.keys(positionToCommitteeMap).includes(parts[1]!)
  ) {
    const position = parts
      .slice(2, parts.length)
      .reduce((sum, item) => sum + "." + item);

    return `/committees/${positionToCommitteeMap[parts[1] as keyof typeof positionToCommitteeMap]}/position/${position}`;
  } else if (parts[0] == "dchip") {
    return `/committees/dchip/position/${positionId}`;
  }
  return `/committees/other/position/${positionId}`;
};
