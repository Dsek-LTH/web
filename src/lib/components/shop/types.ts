import { QuestionType } from "$lib/server/shop/questions";
import { ShoppableType, type PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

/**
 * @param authorId member id
 */
export const createTicket = async (
  prisma: PrismaClient,
  authorId: string,
  data: z.infer<typeof ticketSchema>,
) => {
  return await prisma.ticket.create({
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
          questions: {
            createMany: {
              data: data.questions.map((q) => ({
                ...q,
                options:
                  q.options === undefined
                    ? undefined
                    : {
                        createMany: {
                          data: q.options,
                        },
                      },
              })),
            },
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
};

export const updateTicket = async (
  prisma: PrismaClient,
  ticketId: string,
  data: z.infer<typeof ticketSchema>,
) => {
  const updatedQuestions = data.questions.filter((q) => q.id !== undefined);
  const newQuestions = data.questions.filter((q) => q.id === undefined);

  await prisma.ticket.update({
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
  // Update questions
  for (const question of updatedQuestions) {
    await prisma.itemQuestion.update({
      // have to do a loop
      where: {
        id: question.id!,
      },
      data: {
        ...question,
        options:
          question.options === undefined
            ? undefined
            : {
                deleteMany: {},
                createMany: {
                  data: question.options,
                },
              },
      },
    });
  }
  // create new questions
  if (newQuestions.length > 0) {
    await prisma.itemQuestion.createMany({
      data: newQuestions.map((q) => ({
        ...q,
        shoppableId: ticketId,
        options:
          q.options === undefined
            ? undefined
            : {
                createMany: {
                  data: q.options,
                },
              },
      })),
    });
  }
  // remove questions that are not in the form
  // remove unanswered questions (easy)
  await prisma.itemQuestion.deleteMany({
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
  await prisma.itemQuestion.updateMany({
    where: {
      shoppableId: ticketId,
      id: {
        notIn: updatedQuestions.map((q) => q.id!),
      },
    },
    data: {
      removedAt: null,
    },
  });
};

export const ticketSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty"),
    titleEn: z.string().nullable().optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .nullable()
      .optional(),
    descriptionEn: z.string().nullable().optional(),
    // price is in SEK, with a maximum of two decimals
    price: z.number().gte(0),
    availableFrom: z.date(),
    availableTo: z.date().nullable().optional(), // cannot be before availableFRom
    eventId: z.string().uuid(),
    stock: z.number().int("Stock must be an integer").gte(0),
    maxAmountPerUser: z
      .number()
      .int("Max amount per user must be an integer")
      .positive()
      .optional(),
    questions: z.array(
      z
        .object({
          id: z.string().uuid().optional(),
          title: z.string().min(1, "Title cannot be empty"),
          titleEn: z.string().nullable().optional(),
          description: z.string().default(""),
          descriptionEn: z.string().nullable().optional(),
          // type can be any of "multple-choice" or "text"
          type: z.nativeEnum(QuestionType).default(QuestionType.Text),
          forExternalsOnly: z.boolean().default(false),
          options: z
            .array(
              z.object({
                answer: z.string().min(1, "Answer cannot be empty"),
                answerEn: z.string().nullable().optional(),
                extraPrice: z.number().int().default(0).nullable(),
              }),
            )
            .optional(),
        })
        .refine(
          (arg) =>
            arg.type !== QuestionType.MultipleChoice ||
            arg.options !== undefined,
          {
            message: "Multiple choice questions must have options",
            path: ["type"],
          },
        ),
    ),
  })
  .refine(
    (data) =>
      !data.availableTo ||
      dayjs(data.availableFrom).isBefore(dayjs(data.availableTo)),
    {
      message: "Available from must be before available to",
      path: ["availableTo"],
    },
  );

export type TicketSchema = Infer<typeof ticketSchema>;
