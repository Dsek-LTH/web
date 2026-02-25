import servePdf from "$lib/utils/servePdf";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
	return servePdf("styrdokument/releases/download/latest/stadgar.pdf");
};
