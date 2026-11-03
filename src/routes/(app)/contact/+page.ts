import { api } from "$lib/api/client";
import type { components } from "$lib/api/schema";
import type { PageLoad } from "./$types";

type Position = components["schemas"]["PositionDetail"];
type Member = components["schemas"]["Member"];

export type PositionHolder = { position: Position; member: Member };

export const load: PageLoad = async ({ fetch }) => {
  // The position's current holder, or null if it's vacant.
  const currentHolder = async (id: string): Promise<PositionHolder | null> => {
    const res = await api.GET("/positions/{id}", {
      fetch,
      params: { path: { id } },
    });
    if (!res.data) return null;
    const now = Date.now();
    const mandate = res.data.mandates?.find(
      (mandate) =>
        mandate.member &&
        mandate.startDate &&
        mandate.endDate &&
        new Date(mandate.startDate).valueOf() <= now &&
        new Date(mandate.endDate).valueOf() >= now,
    );
    return mandate?.member
      ? { position: res.data, member: mandate.member }
      : null;
  };

  const [vordf, ordf, nara, pm, root, committees] = await Promise.all([
    currentHolder("dsek.vice_ordf"),
    currentHolder("dsek.ordf"),
    currentHolder("dsek.nari.mastare"),
    currentHolder("dsek.cpu.mastare"),
    currentHolder("dsek.cpu.root"),
    api.GET("/committees", { fetch }).then((res) => res.data ?? []),
  ]);
  const committee = (shortName: string) =>
    committees.find((c) => c.shortName === shortName) ?? null;

  return {
    vordf,
    ordf,
    nara,
    pm,
    root,
    trivsel: committee("trivsel"),
    cpu: committee("cpu"),
  };
};
