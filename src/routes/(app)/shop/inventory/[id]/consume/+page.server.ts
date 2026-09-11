import { consumeConsumable } from "$lib/server/shop/consumable";
import apiNames from "$lib/utils/apiNames";
import { authorise } from "$lib/utils/authorization";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  const { user, prisma } = locals;
  authorise(apiNames.WEBSHOP.CONSUME, user);

  const consumeMessage = await consumeConsumable(prisma, params.id);
  return consumeMessage;
};
