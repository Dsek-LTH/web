import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url.server";
import { toString as semesterToString } from "$lib/utils/semesters";
import { api } from "$lib/api/client";

// The old load's sync() call (search-index sync) is dropped, not ported -
// an unrelated later-phase concern (see DESIGN.md's roadmap "Search"
// phase), not medals' job.
export const load: PageLoad = async ({ fetch, url }) => {
  const semester = getSemesterOrThrowSvelteError(url);
  const res = await api.GET("/medals", {
    fetch,
    params: { query: { semester: semesterToString(semester) } },
  });
  if (res.error) throw error(500, "Failed to load medal recipients");

  return {
    recipients: res.data ?? [],
  };
};
