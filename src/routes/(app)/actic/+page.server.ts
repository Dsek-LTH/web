import type { PageServerLoad } from "./$types";
import { getGoverningCatalog } from "$lib/server/styrdokument";

export const load: PageServerLoad = async () => {
  try {
    return {
      governingCatalog: await getGoverningCatalog(),
      governingCatalogError: false,
    };
  } catch {
    return { governingCatalog: [], governingCatalogError: true };
  }
};
