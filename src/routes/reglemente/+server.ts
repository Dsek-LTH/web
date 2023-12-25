import servePdf from "$lib/utils/servePdf";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ setHeaders }) => {
  return servePdf(
    "reglemente/releases/latest/download/reglemente.pdf",
    setHeaders,
  );
};
