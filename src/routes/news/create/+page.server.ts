import { accessGuard } from "$lib/access";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.getSession()
  await accessGuard('news.create', session?.user, '1');
}