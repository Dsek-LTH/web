// src/routes/api/pdf/[pathName].ts in SvelteKit

import servePdf from "$lib/utils/servePdf";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const { pathName } = params;

  return servePdf(pathName, setHeaders);
};
