import { api } from "$lib/api/client";
import type { components } from "$lib/api/schema";

/** The committee fields needed by the article form and its previews. */
export type CommitteeOption = Pick<
  components["schemas"]["Committee"],
  "id" | "name" | "nameSv" | "nameEn" | "shortName" | "symbolUrl"
>;

export const getCommitteeOptions = async (
  fetch: typeof globalThis.fetch,
): Promise<CommitteeOption[]> => {
  const res = await api.GET("/committees", { fetch });
  return (res.data ?? []).map(
    ({ id, name, nameSv, nameEn, shortName, symbolUrl }) => ({
      id,
      name,
      nameSv,
      nameEn,
      shortName,
      symbolUrl,
    }),
  );
};
