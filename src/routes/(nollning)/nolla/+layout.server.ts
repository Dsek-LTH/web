import { redirect } from "$lib/utils/redirect";

const CUTOFF_DATE = Date.parse("2025-08-25T14:00:00");
export const load = () => {
  if (Date.now() > CUTOFF_DATE) {
    redirect(302, "/nollning");
  }
};
