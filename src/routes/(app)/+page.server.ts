import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { i18n } from "$lib/utils/i18n";

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals;
  if (user?.memberId) {
    redirect(302, i18n.resolveRoute("/home"));
  }
};
