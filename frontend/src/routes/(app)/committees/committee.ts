import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";
import { error } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms/server";
import { updateCommitteeBody, updateCommitteeSchema } from "./types";

/**
 * Load all data that every committee load function needs. Kept generic
 * over a plain `fetch` (rather than switching to $lib/server/apiClient's
 * serverApi like committeeActions in ./committee.server.ts) because it's
 * called from both a universal `+layout.ts` (committees/+layout.ts) and
 * `.server.ts` files - a universal load can't import server-only code at
 * all, which is why committeeActions lives in a separate `.server.ts`
 * file rather than alongside this one (a single shared module would make
 * this file's own static `$lib/server/apiClient` import poison every
 * universal-load importer, even though only committeeActions used it).
 * This is fine: GET /committees/{shortName} is a public read (see
 * backend/CLAUDE.md's Directory routes section), so it doesn't need the
 * acting identity to be correct.
 * @param fetch The SvelteKit-provided fetch (forwards cookies to the Go API)
 * @param shortName The committee's short name
 * @param url The URL object
 * @returns All data that the every committee load function needs
 */
export const committeeLoad = async (
  fetch: typeof globalThis.fetch,
  shortName: string,
  url: URL,
) => {
  const currentYear = new Date().getFullYear();
  const rawYear = url.searchParams.get("year");
  const year = rawYear === null ? currentYear : parseInt(rawYear);
  // Allow to see committees from 1982 to the NEXT year
  if (isNaN(year) || year < 1982 || year > currentYear + 1) {
    error(400, m.committees_errors_invalidYear());
  }

  const res = await api.GET("/committees/{shortName}", {
    fetch,
    params: { path: { shortName }, query: { year } },
  });
  if (res.error) {
    throw error(404, m.committees_errors_committeeNotFound());
  }
  const committee = res.data;

  const form = await superValidate(committee, zod4(updateCommitteeSchema));

  // markdownEn is omitted from the Go response entirely (not sent as
  // null) when unset - `?? ""` here keeps it a defined string so it can
  // safely bind into Editor.svelte's `value = $bindable("")` prop below;
  // Svelte 5 throws props_invalid_value if a bindable prop with a
  // non-undefined fallback is bound an actually-undefined value.
  const markdownForm = await superValidate(
    {
      markdownSv: committee.aboutMarkdown.markdownSv,
      markdownEn: committee.aboutMarkdown.markdownEn ?? "",
      markdownSlug: shortName,
    },
    zod4(updateCommitteeBody),
  );

  const linksForm = await superValidate(
    {
      markdownSv: committee.linksMarkdown.markdownSv,
      markdownEn: committee.linksMarkdown.markdownEn ?? "",
      markdownSlug: shortName + "_links",
    },
    zod4(updateCommitteeBody),
  );

  return {
    committee,
    positions: committee.positions ?? [],
    uniqueMemberCount: committee.memberCount ?? 0,
    numberOfMandates: committee.mandateCount ?? 0,
    markdown: committee.aboutMarkdown,
    links: committee.linksMarkdown,
    form,
    markdownForm,
    linksForm,
    year,
  };
};

export type CommitteeLoadData = Awaited<ReturnType<typeof committeeLoad>>;
