import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { committeeLoad } from "./committee";

export const load: LayoutLoad = ({ url, params, fetch }) => {
  const committee = params.shortName ?? url.pathname.split("/")[2];
  // /committees itself has no page: the committee list is on /about. This
  // layout runs before the page's load, so the redirect has to happen here.
  if (!committee) {
    redirect(301, "/about#committees");
  }
  return committeeLoad(fetch, committee, url);
};
