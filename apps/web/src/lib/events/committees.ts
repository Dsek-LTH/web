import { api } from "$lib/api/client";
import type { components } from "$lib/api/schema";

/** The organizing committee shown on an event, and picked in the event form. */
export type EventCommittee = Pick<
  components["schemas"]["Committee"],
  "id" | "name" | "shortName" | "symbolUrl"
>;

/** The committees an event's organizer can be picked from, for the event form. */
export const getEventCommitteeOptions = async (
  fetch: typeof globalThis.fetch,
): Promise<EventCommittee[]> => {
  const res = await api.GET("/committees", { fetch });
  return (res.data ?? []).map(({ id, name, shortName, symbolUrl }) => ({
    id,
    name,
    shortName,
    symbolUrl,
  }));
};
