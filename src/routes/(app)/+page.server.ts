import { redirect } from "$lib/utils/redirect";
import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = async ({ locals }) => {
  const { user, isApp } = locals;
  if (isApp) {
    redirect(302, "/app/home");
  }
  if (user?.memberId) {
    // redirect(302, "/home");
  }
};
