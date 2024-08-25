import { redirect } from "$lib/utils/redirect";

const CUTOFF_DATE = Date.parse("2024-08-26T00:00:00");
export const load = () => {
  if (Date.now() > CUTOFF_DATE) {
    redirect(302, "/nollning");
  }
};
