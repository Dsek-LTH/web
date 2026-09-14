import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import * as messages from "$paraglide/messages";

export const consumeConsumable = async (
  prisma: ExtendedPrisma,
  consumableId: string,
): Promise<Message> => {
  try {
    await prisma.consumable.update({
      where: {
        id: consumableId,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  } catch (e) {
    if (e instanceof Error)
      return {
        message: e.message,
        type: "error",
      };
    return {
      message: messages.shop_could_not_consume_ticket(),
      type: "error",
    };
  }
  return {
    message: messages.shop_ticket_consumed(),
    type: "success",
  };
};
