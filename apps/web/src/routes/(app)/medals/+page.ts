import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getSemesterOrThrowSvelteError } from "$lib/utils/url";
import {
  dateToSemester,
  FIRST_MEDALS_SEMESTER,
  toString as semesterToString,
} from "$lib/utils/semesters";
import { api } from "$lib/api/client";

// The old load's sync() call (search-index sync) is dropped - search
// indexing isn't medals' job.
export const load: PageLoad = async ({ fetch, url }) => {
  const semester = getSemesterOrThrowSvelteError(url);
  const res = await api.GET("/medals", {
    fetch,
    params: { query: { semester: semesterToString(semester) } },
  });
  if (res.error)
    error(
      res.response.status,
      res.error.detail ?? "Failed to load medal recipients",
    );

  return {
    recipients: res.data ?? [],
    semester,
    // Where the page's previous/next links stop; Go answers 422 outside.
    minSemester: FIRST_MEDALS_SEMESTER,
    maxSemester: dateToSemester(new Date()),
  };
};
