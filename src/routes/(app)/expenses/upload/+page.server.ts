import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";
import { uploadFile } from "$lib/files/uploadFiles";
import authorizedPrismaClient from "$lib/server/shop/authorizedPrisma";
import sendNotification from "$lib/utils/notifications";
import { NotificationType } from "$lib/utils/notifications/types";
import { redirect } from "$lib/utils/redirect";
import type { Member, Prisma } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import { fail } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms/server";
import { COST_CENTERS, getCostCenter } from "../config";
import createBasicReceipt from "./baseItem";
import { expenseSchema } from "./types";
import { getFullName } from "$lib/utils/client/member";

export const load = async () => {
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
const expensePhotoUrl = (date: Date, id: string) =>
  `public/expenses/${date.getFullYear()}/${months[date.getMonth()]}/${id}`;
const uploadReceipt = async (
  user: AuthUser,
  image: File,
  date: Date,
  id: string,
) => {
  const imageUrl = await uploadFile(
    user,
    image,
    expensePhotoUrl(date, id),
    PUBLIC_BUCKETS_FILES,
    undefined,
    {
      resize: {
        width: 1920,
        height: 1920,
        fit: "contain",
      },
    },
  );
  return imageUrl;
};

const removeReceiptImages = (user: AuthUser, date: Date, id: string) =>
  removeFilesWithoutAccessCheck(user, PUBLIC_BUCKETS_FILES, [
    expensePhotoUrl(date, id),
  ]);

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 week
const CACHED_SIGNERS: Record<string, Member["id"] | undefined> = {};
let CACHE_UPDATED_AT = 0;

const TREASURER = "dsek.skattm.mastare";
const PRESIDENT = "dsek.skattm.funk";

const updateSignersCache = async () => {
  const allSigners = new Set([
    ...COST_CENTERS.map((center) => center.signer),
    TREASURER,
    PRESIDENT,
  ]);
  const signers = await authorizedPrismaClient.mandate.findMany({
    where: {
      positionId: {
        in: [...allSigners],
      },
      startDate: {
        lte: new Date(),
        gte: new Date(),
      },
    },
    select: {
      positionId: true,
      memberId: true,
    },
  });
  CACHE_UPDATED_AT = Date.now();
  signers.forEach((signer) => {
    CACHED_SIGNERS[signer.positionId] = signer.memberId;
  });
  return signers;
};

/**
 * Assumes cache is updated, gets the member id for a signer positionId
 */
const getSigner = (signer: string) => {
  if (signer in CACHED_SIGNERS) {
    return CACHED_SIGNERS[signer]!;
  }
  return undefined; // might be a vacant position
};

/**
 * In our policy we have a logic which desides how to handle edge cases where the signer is vacant, or the signer is also the user creating the expense.
 * This method resolves said logic (or throws if impossible, which would be really rare).
 */
const resolveSignerLogic = (
  signer: string | undefined,
  userMemberId: string,
  costCenterName: string,
) => {
  if (signer !== userMemberId && signer !== undefined) return signer;

  // user is signer, or signer is vacant
  signer = getSigner(TREASURER);
  if (signer !== userMemberId && signer !== undefined) return signer;

  // user is TREASURER, or treasurer is vacant
  signer = getSigner(PRESIDENT);
  if (signer !== userMemberId && signer !== undefined) return signer;

  // user is PRESIDENT AND TREASURER (OR: President is vacant, user is treasurer, OR: treasurer is vacant and user is president)
  throw new Error(
    `Signer logic could not be resolved for cost center ${costCenterName}. Treasurer: ${getSigner(TREASURER)}, President: ${getSigner(PRESIDENT)}, User: ${userMemberId}`,
  );
};

export const actions = {
  default: async (event) => {
    const { locals, request } = event;
    const { prisma, user, member } = locals;
    const form = await superValidate(request, zod(expenseSchema));
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
    if (CACHE_UPDATED_AT < Date.now() - CACHE_TTL) {
      await updateSignersCache();
    }
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
              amount: row.amount,
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
      await sendNotification({
        title: "Skriv under utlägg",
        message: `${getFullName(member, {
          hideNickname: true,
        })} har skapat ett utlägg som du behöver signera.`,
        link: `/expenses`,
        type: NotificationType.EXPENSES,
        memberIds: [...signerMemberIds],
        fromMemberId: member.id, // send notification from the creator of the expense
      });
    } catch (e) {
      console.error(`Could not send notification when creating expense`, e);
    }

    throw redirect(
      `/expenses`,
      {
        message: "Utlägg skapat",
        type: "success",
      },
      event,
    );
  },
};
