import { redirect } from "$lib/utils/redirect";

export const load = async () => {
  throw redirect(308, "/info/contact");
};
