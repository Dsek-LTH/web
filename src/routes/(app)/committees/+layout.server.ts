import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { committeeLoad } from "./committee.server";

export const load: LayoutServerLoad = ({ url, locals, params }) => {
  const committee = params.shortName ?? url.pathname.split("/")[2];
  if (committee == undefined) {
    redirect(301, "/about#committees");
  }
  return committeeLoad(locals.prisma, committee, url);
};
