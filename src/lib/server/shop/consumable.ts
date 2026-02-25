import type { ExtendedPrisma } from "$lib/server/extendedPrisma";

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
			message: "Kunde inte konsumera biljetten.",
			type: "error",
		};
	}
	return {
		message: "Biljetten har konsumerats.",
		type: "success",
	};
};
