import type { ExtendedPrisma } from "$lib/server/extendedPrisma";
import type { TransactionClient } from "$lib/server/shop/types";
import { convertPriceToCents } from "$lib/utils/convertPrice";
import type { TicketSchema } from "$lib/utils/shop/types";
import { ShoppableType } from "@prisma/client";

/**
 * @param authorId member id
 */
export const createTicket = async (
  prisma: ExtendedPrisma,
  authorId: string,
  data: TicketSchema,
) => {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        shoppable: {
          create: {
            titleSv: data.titleSv,
            titleEn: data.titleEn,
            descriptionSv: data.descriptionSv,
            descriptionEn: data.descriptionEn,
            price: convertPriceToCents(data.price),
            availableFrom: data.availableFrom,
            availableTo: data.availableTo,
            type: ShoppableType.TICKET,
            authorId: authorId,
            accessPolicies: (data.accessPolicies?.length ?? 0) > 0
              ? {
                createMany: {
                  data: data.accessPolicies!,
                },
              }
              : undefined,
          },
        },
        event: {
          connect: {
            id: data.eventId,
          },
        },
        stock: data.stock,
        maxAmountPerUser: data.maxAmountPerUser, // optional
      },
    });
    for (const question of data.questions) {
      await tx.itemQuestion.create({
        data: {
          shoppableId: ticket.id,
          ...question,
          titleSv: question.titleSv,
          descriptionSv: question.descriptionSv,
          id: undefined,
          options: question.options === undefined ? undefined : {
            createMany: {
              data: question.options.map((o) => ({
                ...o,
                answerSv: o.answerSv,
                extraPrice: o.extraPrice
                  ? convertPriceToCents(o.extraPrice)
                  : o.extraPrice,
              })),
            },
          },
        },
      });
    }
    return ticket;
  });
};

export const updateTicket = async (
  prisma: ExtendedPrisma,
  ticketId: string,
  data: TicketSchema,
) => {
  const updatedQuestions = data.questions.filter((q) => !!q.id);
  const newQuestions = data.questions.filter((q) => !q.id);
  const updatedPolicies = data.accessPolicies?.filter((p) => !!p.id);
  const newPolicies = data.accessPolicies?.filter((p) => !p.id);
  console.log(updatedPolicies);
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        shoppable: {
          update: {
            titleSv: data.titleSv,
            titleEn: data.titleEn,
            descriptionSv: data.descriptionSv,
            descriptionEn: data.descriptionEn,
            price: convertPriceToCents(data.price),
            availableFrom: data.availableFrom,
            availableTo: data.availableTo,
            type: ShoppableType.TICKET,
            accessPolicies: updatedPolicies && updatedPolicies.length > 0
              ? {
                updateMany: updatedPolicies.map((p) => ({
                  data: {
                    ...p,
                  },
                  where: {
                    id: p.id!,
                  },
                })),
              }
              : {
                deleteMany: {},
              },
          },
        },
        event: {
          connect: {
            id: data.eventId,
          },
        },
        stock: data.stock,
        maxAmountPerUser: data.maxAmountPerUser, // optional
      },
    });
    if (newPolicies && newPolicies.length > 0) {
      await tx.shoppableAccessPolicy.createMany({
        data: newPolicies.map((p) => ({
          ...p,
          shoppableId: ticketId,
        })),
      });
    }
    await updateQuestions(tx, ticketId, updatedQuestions, newQuestions);
  });
};

const updateQuestions = async (
  tx: TransactionClient,
  ticketId: string,
  updatedQuestions: TicketSchema["questions"],
  newQuestions: TicketSchema["questions"],
) => {
  // remove questions that are not in the form
  // remove unanswered questions (easy)
  const removableQuestions = await tx.itemQuestion.findMany({
    where: {
      shoppableId: ticketId,
      id: {
        notIn: updatedQuestions.map((q) => q.id!),
      },
      responses: {
        none: {}, // ensures no responses exist.
      },
    },
    select: {
      id: true,
    },
  });
  await tx.itemQuestion.deleteMany({
    where: {
      id: {
        in: removableQuestions.map((q) => q.id),
      },
    },
  });
  // keep answered questions in DB but mark as removed
  await tx.itemQuestion.updateMany({
    where: {
      shoppableId: ticketId,
      id: {
        notIn: updatedQuestions.map((q) => q.id!),
      },
    },
    data: {
      removedAt: new Date(),
    },
  });
  // Update questions
  for (const question of updatedQuestions) {
    await tx.itemQuestionOption.deleteMany({
      where: {
        questionId: question.id!,
      },
    });
    await tx.itemQuestion.update({
      // have to do a loop
      where: {
        id: question.id!,
      },
      data: {
        ...question,
        id: undefined,
        options: question.options === undefined ? undefined : {
          createMany: {
            data: question.options.map((o) => ({
              ...o,
              answerSv: o.answerSv,
              extraPrice: o.extraPrice
                ? convertPriceToCents(o.extraPrice)
                : o.extraPrice,
            })),
          },
        },
      },
    });
  }
  // create new questions
  if (newQuestions.length > 0) {
    for (const question of newQuestions) {
      // have to do a loop
      await tx.itemQuestion.create({
        data: {
          ...question,
          titleSv: question.titleSv,
          descriptionSv: question.descriptionSv,
          id: undefined,
          shoppableId: ticketId,
          options: question.options === undefined ? undefined : {
            createMany: {
              data: question.options.map((o) => ({
                ...o,
                answerSv: o.answerSv,
                extraPrice: o.extraPrice
                  ? convertPriceToCents(o.extraPrice)
                  : o.extraPrice,
              })),
            },
          },
        },
      });
    }
  }
};
