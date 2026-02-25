import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import type { QuestionForm } from "$lib/utils/shop/types";
import type { Infer, SuperValidated } from "sveltekit-superforms";
import z from "zod";

export const purchaseForm = z.object({
	idempotencyKey: z.string(),
});
export type PurchaseForm = Infer<typeof purchaseForm>;

type ItemMetadata = {
	shoppable: ExtendedPrismaModel<"Shoppable"> &
		ExtendedPrismaModel<"Ticket"> & {
			event: ExtendedPrismaModel<"Event">;
		};
};
export type CartItem = ExtendedPrismaModel<"Consumable"> &
	ItemMetadata & {
		shoppable: {
			questions: Array<
				ExtendedPrismaModel<"ItemQuestion"> & {
					options: Array<ExtendedPrismaModel<"ItemQuestionOption">>;
					form: SuperValidated<QuestionForm>;
				}
			>;
		};
		questionResponses: Array<ExtendedPrismaModel<"ItemQuestionResponse">>;
	};
export type CartReservation = ExtendedPrismaModel<"ConsumableReservation"> &
	ItemMetadata & {
		shoppable: {
			gracePeriodEndsAt: Date;
		};
	};
