import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// Probably redundant, handled in +layout.server.ts but to scared to remove file
export const load: PageServerLoad = async () => {
  throw redirect(301, "/about#committees");
};
