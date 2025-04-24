import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";
import { uploadFile } from "$lib/files/uploadFiles";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { redirect } from "$lib/utils/redirect";
import * as m from "$paraglide/messages";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import { fail } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import createBasicReceipt from "../baseItem";
import { getCostCenter } from "../config";
import {
  getSigner,
  resolveSignerLogic,
  updateSignersCacheIfNecessary,
} from "../signers";
import { expenseSchema } from "../types";
import { sendNotificationToSigner } from "../helper";
import { authorize } from "$lib/utils/authorization";
import apiNames from "$lib/utils/apiNames";
import { convertPriceToCents } from "$lib/utils/convertPrice";

export const load = async ({ locals: { user } }) => {
  authorize(apiNames.EXPENSES.CREATE, user);
  return {
    form: await superValidate(
      {
        date: new Date(),
        isGuildCard: false,
        receipts: [createBasicReceipt()],
      },
      zod(expenseSchema),
      {
        errors: false,
      },
    ),
  };
};
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const expensePhotoUrl = (date: Date, id: number) =>
  `public/expenses/${date.getFullYear()}/${months[date.getMonth()]}/${id}`;
const uploadReceipt = async (
  user: AuthUser,
  image: File,
  date: Date,
  id: number,
) => {
  const imageUrl = await uploadFile(
    user,
    image,
    expensePhotoUrl(date, id),
    PUBLIC_BUCKETS_FILES,
    undefined,
    { resize: { width: 1920, height: 1920, fit: "outside" } },
  );
  return imageUrl;
};

const removeReceiptImages = (user: AuthUser, date: Date, id: number) =>
  removeFilesWithoutAccessCheck(user, PUBLIC_BUCKETS_FILES, [
    expensePhotoUrl(date, id),
  ]);

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod(expenseSchema), {
      allowFiles: true,
    });
    if (!form.valid) return fail(400, { form });
    if (!member) throw fail(401, { form });
    const expense = await prisma.expense.create({
      data: {
        date: form.data.date,
        description: form.data.description,
        isGuildCard: form.data.isGuildCard,
        memberId: member?.id,
      },
    });
    await updateSignersCacheIfNecessary();
    const itemPromiseResults = await Promise.allSettled(
      form.data.receipts.map(
        async (receipt): Promise<Prisma.ExpenseItemCreateManyInput[]> => {
          const uploadedReceipt = await uploadReceipt(
            user,
            receipt.image,
            expense.date,
            expense.id,
          );

          return receipt.rows.map((row) => {
            const costCenter = getCostCenter(row.costCenter);
            const signer = resolveSignerLogic(
              getSigner(costCenter.signer),
              member.id,
              costCenter.name,
            );
            return {
              expenseId: expense.id,
              costCenter: row.costCenter,
              amount: convertPriceToCents(row.amount),
              receiptUrl: uploadedReceipt,
              comment: row.comment,
              committeeShortName: costCenter.committee,
              signerMemberId: signer,
            };
          });
        },
      ),
    );
    for (const promiseResult of itemPromiseResults) {
      if (promiseResult.status === "rejected") {
        await authorizedPrismaClient.expense.delete({
          where: {
            id: expense.id,
          },
        });
        try {
          await removeReceiptImages(user, expense.date, expense.id);
        } catch {
          // we don't do anything. If this method failed, then "uploadReceipt" also failed
          // it is clearer for the user to show the error message from "uploadReceipt" rather than this method
        }
        return message(form, {
          message:
            promiseResult.reason instanceof Error
              ? promiseResult.reason.message
              : promiseResult.reason,
          type: "error",
        });
      }
    }
    const items = itemPromiseResults
      .filter((promiseResults) => promiseResults.status === "fulfilled")
      .flatMap(({ value: item }) => item);
    try {
      await prisma.expenseItem.createMany({
        data: items,
      });
    } catch (e) {
      await authorizedPrismaClient.expense.delete({
        where: {
          id: expense.id,
        },
      });
      try {
        await removeReceiptImages(user, expense.date, expense.id);
      } catch {
        // we don't do anything. If this method failed, then "uploadReceipt" also failed
        // it is clearer for the user to show the error message from "uploadReceipt" rather than this method
      }
      return message(form, {
        message: e instanceof Error ? e.message : e,
        type: "error",
      });
    }

    const signerMemberIds = new Set(items.map((item) => item.signerMemberId));

    try {
      await sendNotificationToSigner(member, expense, [...signerMemberIds]);
    } catch (e) {
      // we don't want it to fail for the user
      console.warn("Failed to send notificaiton to expenses signers", e);
    }

    throw redirect(
      `/expenses`,
      {
        message: m.expenseCreated(),
        type: "success",
      },
      event,
    );
  },
};
