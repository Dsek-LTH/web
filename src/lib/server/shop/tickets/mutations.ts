import type { TicketSchema } from "$lib/utils/shop/types";
import { PrismaClient, ShoppableType } from "@prisma/client";

/**
 * @param authorId member id
 */
export const createTicket = async (
  prisma: PrismaClient,
  authorId: string,
  data: TicketSchema,
) => {
  return await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({
      data: {
        shoppable: {
          create: {
            title: data.title,
            titleEn: data.titleEn,
            description: data.description,
            descriptionEn: data.descriptionEn,
            price: Math.round(data.price * 100),
            availableFrom: data.availableFrom,
            availableTo: data.availableTo,
            type: ShoppableType.TICKET,
            authorId: authorId,
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
          id: undefined,
          options:
            question.options === undefined
              ? undefined
              : {
                  createMany: {
                    data: question.options.map((o) => ({
                      ...o,
                      extraPrice: o.extraPrice
                        ? Math.round(o.extraPrice * 100)
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
  prisma: PrismaClient,
  ticketId: string,
  data: TicketSchema,
) => {
  const updatedQuestions = data.questions.filter((q) => !!q.id);
  const newQuestions = data.questions.filter((q) => !!q.id);
  console.log(updatedQuestions, newQuestions);
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        shoppable: {
          update: {
            title: data.title,
            titleEn: data.titleEn,
            description: data.description,
            descriptionEn: data.descriptionEn,
            price: Math.round(data.price * 100),
            availableFrom: data.availableFrom,
            availableTo: data.availableTo,
            type: ShoppableType.TICKET,
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
    // remove questions that are not in the form
    // remove unanswered questions (easy)
    await tx.itemQuestion.deleteMany({
      where: {
        shoppableId: ticketId,
        id: {
          notIn: updatedQuestions.map((q) => q.id!),
        },
        responses: {
          none: {}, // ensures no responses exist.
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
      console.log(question, question.options);
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
          options:
            question.options === undefined
              ? undefined
              : {
                  createMany: {
                    data: question.options.map((o) => ({
                      ...o,
                      extraPrice: o.extraPrice
                        ? Math.round(o.extraPrice * 100)
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
        console.log(question, question.options);
        // have to do a loop
        await tx.itemQuestion.create({
          data: {
            ...question,
            id: undefined,
            shoppableId: ticketId,
            options:
              question.options === undefined
                ? undefined
                : {
                    createMany: {
                      data: question.options.map((o) => ({
                        ...o,
                        extraPrice: o.extraPrice
                          ? Math.round(o.extraPrice * 100)
                          : o.extraPrice,
                      })),
                    },
                  },
          },
        });
      }
    }
  });
};
