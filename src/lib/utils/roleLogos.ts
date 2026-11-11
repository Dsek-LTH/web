export type RoleLogo = {
  path: string;
  logoUrl: string;
};

export const roleLogoMap = (logos: Iterable<RoleLogo>) =>
  new Map([...logos].map(({ path, logoUrl }) => [path, logoUrl]));

export const resolveRoleLogo = (
  positionId: string,
  logos: ReadonlyMap<string, string>,
): string | undefined => {
  const parts = positionId.split(".");
  for (let i = parts.length; i > 0; i--) {
    const logo = logos.get(parts.slice(0, i).join("."));
    if (logo) return logo;
  }
};
