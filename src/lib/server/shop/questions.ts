import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import {
  dbIdentification,
  type ShopIdentification,
} from "$lib/server/shop/types";
import { z } from "zod";
import * as m from "$paraglide/messages";
import { QuestionType, type questionForm } from "$lib/utils/shop/types";

type AnswerQuestionData = z.infer<typeof questionForm>;

export const answerQuestion = async (
  prisma: ExtendedPrisma,
  identification: ShopIdentification,
  data: AnswerQuestionData,
) => {
  const consumable = await prisma.consumable.findUnique({
    where: {
      ...dbIdentification(identification),
      id: data.consumableId,
      shoppable: {
        questions: {
          some: {
            removedAt: null,
            id: data.questionId,
          },
        },
      },
    },
    include: {
      shoppable: {
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      },
    },
  });
  if (!consumable) {
    throw new Error(m.cart_errors_itemNotInCart());
  }
  const question = consumable.shoppable.questions.find(
    (q) => q.id === data.questionId,
  );
  if (!question) throw new Error("Question not found");

  let extraPrice: number;
  switch (question.type) {
    case QuestionType.MultipleChoice: {
      const answerObj = question.options.find(
        (option) =>
          option.answer === data.answer || option.answerEn === data.answer,
      );

      // user tried to send option which doesn't exist
      if (!answerObj) throw new Error("Invalid option");

      // user tried to send a different answer text than the correct one
      if (
        answerObj.answer !== data.answer &&
        answerObj.answerEn !== data.answer
      )
        throw new Error("Corrupt answer");

      // all checks clear, good answer!
      extraPrice = answerObj.extraPrice ?? 0;
      break;
    }
    case QuestionType.Text:
      // no checks to be done. good answer!
      extraPrice = 0;
      break;
    default:
      throw new Error(`The question type "${question.type}" is not supported.`);
  }

  await prisma.itemQuestionResponse.upsert({
    where: {
      questionId_consumableId: {
        questionId: question.id,
        consumableId: consumable.id,
      },
    },
    update: {
      answer: data.answer,
      extraPrice,
    },
    create: {
      consumableId: consumable.id,
      questionId: question.id,
      answer: data.answer,
      extraPrice,
    },
  });
};
