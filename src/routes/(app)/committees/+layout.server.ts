import { fail } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { committeeLoad } from "./committee.server";

export const load: LayoutServerLoad = ({ url, locals, params }) => {
  const committee = params.shortName ?? url.pathname.split("/")[2];
  if (committee == undefined) {
    return fail(404);
  }
  return committeeLoad(locals.prisma, committee, url);
};
