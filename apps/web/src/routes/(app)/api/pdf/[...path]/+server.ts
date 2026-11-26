import type { RequestHandler } from "./$types";
import servePdf from "$lib/utils/servePdf";

export const GET: RequestHandler = async ({ params }) => {
  return servePdf(params.path);
};
