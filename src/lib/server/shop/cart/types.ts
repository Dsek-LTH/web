import type { QuestionForm } from "$lib/utils/shop/types";
import type {
  Consumable,
  ConsumableReservation,
  Event,
  ItemQuestion,
  ItemQuestionOption,
  ItemQuestionResponse,
  Shoppable,
  Ticket,
} from "@prisma/client";
import type { Infer } from "sveltekit-superforms/adapters";
import type { SuperValidated } from "sveltekit-superforms/server";
import z from "zod";

export const purchaseForm = z.object({
  idempotencyKey: z.string(),
});
export type PurchaseForm = Infer<typeof purchaseForm>;

type ItemMetadata = {
  shoppable: Shoppable &
    Ticket & {
      event: Event;
    };
};
export type CartItem = Consumable &
  ItemMetadata & {
    shoppable: {
      questions: Array<
        ItemQuestion & {
          options: ItemQuestionOption[];
          form: SuperValidated<QuestionForm>;
        }
      >;
    };
    questionResponses: ItemQuestionResponse[];
  };
export type CartReservation = ConsumableReservation &
  ItemMetadata & {
    shoppable: {
      gracePeriodEndsAt: Date;
    };
  };
