import { redirect } from "@sveltejs/kit";

const CUTOFF_DATE = Date.parse("2026-08-23T12:00:00"); // this will be in prod: 2026-08-24
export const load = () => {
  if (Date.now() > CUTOFF_DATE) {
    redirect(302, "/nollning");
  }
};
