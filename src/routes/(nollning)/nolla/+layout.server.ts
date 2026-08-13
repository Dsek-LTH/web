import { redirect } from "$lib/utils/redirect";
import { PRE_NOLLNING_DATE } from "$env/static/private";

const CUTOFF_DATE = Date.parse(PRE_NOLLNING_DATE); // this will be in prod: 2026-08-23
export const load = () => {
  if (Date.now() > CUTOFF_DATE) {
    redirect(302, "/nollning");
  }
};
