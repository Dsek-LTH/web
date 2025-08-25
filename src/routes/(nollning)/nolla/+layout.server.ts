import { redirect } from "$lib/utils/redirect";

const CUTOFF_DATE = Date.parse("2025-08-24T12:00:00"); // this will be in prod: 2025-08-25
export const load = () => {
  if (Date.now() > CUTOFF_DATE) {
    redirect(302, "/nollning");
  }
};
