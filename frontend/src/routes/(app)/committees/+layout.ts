import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { committeeLoad } from "./committee";

export const load: LayoutLoad = ({ url, params, fetch }) => {
  const committee = params.shortName ?? url.pathname.split("/")[2];
  if (committee == undefined) {
    error(404);
  }
  return committeeLoad(fetch, committee, url);
};
