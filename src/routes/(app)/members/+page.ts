import { error } from "@sveltejs/kit";
import * as m from "$paraglide/messages";
import { api } from "$lib/api/client";
import type { PageLoad } from "./$types";

const allowedProgrammes = ["D", "C", "VR/AR"];

function yearParam(url: URL): number {
  const raw = url.searchParams.get("year");
  const fallback = new Date().getFullYear();
  const value = raw === null ? fallback : parseInt(raw);
  if (isNaN(value) || value < 1982 || value > new Date().getFullYear()) {
    throw error(400, m.error_invalid_year());
  }
  return value;
}

export const load: PageLoad = async ({ fetch, url }) => {
  const classYear = yearParam(url);
  const rawProgramme = url.searchParams.get("programme");
  const classProgramme =
    rawProgramme && allowedProgrammes.includes(rawProgramme)
      ? rawProgramme
      : "all";

  const { data, error: err } = await api.GET("/members", {
    fetch,
    params: {
      query: {
        classYear,
        // "all" intentionally omits the filter rather than sending it -
        // the API has no "IN (D, C, VR/AR)" filter, so restricting to the
        // guild's known programmes (rather than every classProgramme value
        // ever recorded) happens client-side just below instead.
        ...(classProgramme !== "all" && { classProgramme }),
      },
    },
  });
  if (err) throw error(500, "Failed to load members");

  const members =
    classProgramme === "all"
      ? (data ?? []).filter(
          (member) =>
            member.classProgramme &&
            allowedProgrammes.includes(member.classProgramme),
        )
      : (data ?? []);

  return {
    members,
    programme: classProgramme,
    year: classYear,
  };
};
