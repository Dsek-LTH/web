import type { PageServerLoad } from "./$types";
import { getGoverningCatalog } from "$lib/server/styrdokument";
import type { GoverningGroup } from "$lib/actic/governing";

export type CatalogResult = {
  governingCatalog: GoverningGroup[];
  governingCatalogError: boolean;
};

/**
 * Streamed, not awaited: the landing page renders its shell immediately and
 * the governing list fills in when GitHub answers (or fails). A hanging
 * upstream must never hold the whole page hostage.
 */
export const load: PageServerLoad = () => {
  const catalog = getGoverningCatalog().then(
    (governingCatalog): CatalogResult => ({
      governingCatalog,
      governingCatalogError: false,
    }),
    (): CatalogResult => ({
      governingCatalog: [],
      governingCatalogError: true,
    }),
  );
  return { catalog };
};
