import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";
import { serverApi } from "$lib/server/apiClient";
import { error, fail, type Actions } from "@sveltejs/kit";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, withFiles } from "sveltekit-superforms/server";
import { updateCommitteeBody, updateCommitteeSchema } from "./types";

/**
 * Load all data that every committee load function needs. Kept generic
 * over a plain `fetch` (rather than switching to $lib/server/apiClient's
 * serverApi like committeeActions below) because it's called from both a
 * universal `+layout.ts` (committees/+layout.ts) and `.server.ts` files -
 * a universal load can't import server-only code at all. This is fine:
 * GET /committees/{shortName} is a public read (see
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

  const markdownForm = await superValidate(
    {
      markdownSv: committee.aboutMarkdown.markdownSv,
      markdownEn: committee.aboutMarkdown.markdownEn,
      markdownSlug: shortName,
    },
    zod4(updateCommitteeBody),
  );

  const linksForm = await superValidate(
    {
      markdownSv: committee.linksMarkdown.markdownSv,
      markdownEn: committee.linksMarkdown.markdownEn,
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

export const committeeActions = (
  shortName?: string,
): Actions<{ shortName: string }> => ({
  updateCommitteeMarkdown: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const sn = shortName ?? params.shortName;
    const form = await superValidate(request, zod4(updateCommitteeBody));
    if (!form.valid) return fail(400);

    const { markdownSv, markdownEn, markdownSlug } = form.data;
    if (!markdownSlug || !markdownSv) {
      return message(form, {
        message: m.committees_committeeUpdated(),
        type: "success",
      });
    }

    const body = { markdownSv, markdownEn: markdownEn ?? undefined };
    const res =
      markdownSlug === sn + "_links"
        ? await api.PUT("/committees/{shortName}/links", {
            params: { path: { shortName: sn } },
            body,
          })
        : await api.PUT("/committees/{shortName}/markdown", {
            params: { path: { shortName: sn } },
            body,
          });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
  updateCommitteeDetails: async (event) => {
    const { params, request } = event;
    const api = serverApi(event);
    const sn = shortName ?? params.shortName;
    const form = await superValidate(request, zod4(updateCommitteeSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, withFiles({ form }));

    const res = await api.PATCH("/committees/{shortName}", {
      params: { path: { shortName: sn } },
      body: {
        nameSv: form.data.nameSv ?? "",
        nameEn: form.data.nameEn ?? undefined,
        descriptionSv: form.data.descriptionSv ?? undefined,
        descriptionEn: form.data.descriptionEn ?? undefined,
        darkImageUrl: form.data.darkImageUrl ?? undefined,
        lightImageUrl: form.data.lightImageUrl ?? undefined,
        monoImageUrl: form.data.monoImageUrl ?? undefined,
        symbolUrl: form.data.symbolUrl ?? undefined,
        bannerUrl: form.data.bannerUrl ?? undefined,
        previewUrl: form.data.previewUrl ?? undefined,
        isBannerTextLight: form.data.isBannerTextLight,
      },
    });
    if (res.error) return fail(500, { form });

    return message(form, {
      message: m.committees_committeeUpdated(),
      type: "success",
    });
  },
});

export type CommitteeLoadData = Awaited<ReturnType<typeof committeeLoad>>;
