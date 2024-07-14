import { redirect } from "$lib/utils/redirect";

export const load = async () => {
  throw redirect(302, "https://www.studentlund.se/nationer/");
};
