import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  if (user?.memberId) {
    redirect(302, "/home");
  }
};
