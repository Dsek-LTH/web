/**
 * Committee logos for the position picker, hosted in the guild's graphics repo (the
 * same source the Committee model's image URLs use). Position groups use the
 * package's own keys, which mostly match the committee short names.
 */
const GRAPHICS_URL = "https://raw.githubusercontent.com/Dsek-LTH/grafik/main";

const GROUP_SHORTNAME: Record<string, string> = {
  aktu: "aktu",
  infu: "infu",
  cafe: "cafe",
  skattm: "skattm",
  fram: "fram",
  km: "km",
  nollu: "nollu",
  naru: "naru",
  sexm: "sexm",
  srd: "srd",
  cpu: "cpu",
  medalj: "medalj",
  valb: "valb",
  tackm: "tackm",
  triv: "trivsel",
};

const GUILD_SYMBOL = `${GRAPHICS_URL}/guild/dsek/symbol/symbol_rosa.svg`;

/** Light/dark symbol URLs for a position group, or undefined if it has none. */
export function groupLogoUrls(
  groupKey: string,
): { light: string; dark: string } | undefined {
  // The board and "other elected officials" have no committee of their own.
  if (groupKey === "styr" || groupKey === "otherpos") {
    return { light: GUILD_SYMBOL, dark: GUILD_SYMBOL };
  }
  const shortName = GROUP_SHORTNAME[groupKey];
  if (!shortName) return undefined;
  return {
    light: `${GRAPHICS_URL}/committee_logos/${shortName}/SVG/symbol/light.svg`,
    dark: `${GRAPHICS_URL}/committee_logos/${shortName}/SVG/symbol/dark.svg`,
  };
}
