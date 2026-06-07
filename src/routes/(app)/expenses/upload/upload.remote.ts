import { form, getRequestEvent } from "$app/server";
import * as m from "$paraglide/messages";
import { PUBLIC_BUCKETS_FILES } from "$env/static/public";
import { removeFilesWithoutAccessCheck } from "$lib/files/fileHandler";
import { uploadFile } from "$lib/files/uploadFiles";
import authorizedPrismaClient from "$lib/server/authorizedPrisma";
import { redirect } from "sveltekit-flash-message/server";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@zenstackhq/runtime";
import { getCostCenter } from "../config";
import {
  getSigner,
  resolveSignerLogic,
  updateSignersCacheIfNecessary,
} from "../signers";
import { expenseSchema } from "../types";
import { sendNotificationToSigner } from "../helper";
import { convertPriceToCents } from "$lib/utils/convertPrice";
import { isFileImage, isFilePDF, getNameOfFile } from "$lib/files/utils";
import { PDFDocument, PageSizes } from "pdf-lib";

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
  if (isFilePDF(image)) {
    const url = await uploadFile(
      user,
      image,
      expensePhotoUrl(date, id),
      PUBLIC_BUCKETS_FILES,
      undefined,
      false,
    );
    return url;
  }

  // If an image is uploaded, convert to a single-page PDF and store the PDF
  if (isFileImage(image)) {
    const arrayBuffer = await image.arrayBuffer();
    const inputBytes = new Uint8Array(arrayBuffer);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();

    let embeddedImage;
    const mime = image.type.toLowerCase();
    if (mime.includes("png")) {
      embeddedImage = await pdfDoc.embedPng(inputBytes);
    } else {
      try {
        embeddedImage = await pdfDoc.embedJpg(inputBytes);
      } catch {
        throw new Error("Unsupported image type. Please upload JPEG or a PNG.");
      }
    }

    const MARGIN = 50;
    const pageWidth = width - MARGIN * 2;
    const pageHeight = height - 150;
    const imageRatio = embeddedImage.width / embeddedImage.height;

    let finalWidth = pageWidth;
    let finalHeight = pageWidth / imageRatio;
    if (finalHeight > pageHeight) {
      finalHeight = pageHeight;
      finalWidth = pageHeight * imageRatio;
    }
    const x = (width - finalWidth) / 2;
    const y = (height - finalHeight - 100) / 2;
    page.drawImage(embeddedImage, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });

    const pdfBytes = await pdfDoc.save();

    const ab = new ArrayBuffer(pdfBytes.length);
    new Uint8Array(ab).set(pdfBytes);
    const pdfBlob = new Blob([ab], { type: "application/pdf" });
    const pdfFile = new File([pdfBlob], `${getNameOfFile(image.name)}.pdf`, {
      type: "application/pdf",
    });

    const url = await uploadFile(
      user,
      pdfFile,
      expensePhotoUrl(date, id),
      PUBLIC_BUCKETS_FILES,
      undefined,
      false,
    );
    return url;
  }

  throw new Error("Unsupported file type. Please upload a PDF or image.");
};

const removeReceiptImages = (user: AuthUser, date: Date, id: number) =>
  removeFilesWithoutAccessCheck(user, PUBLIC_BUCKETS_FILES, [
    expensePhotoUrl(date, id),
  ]);

export const createExpense = form(expenseSchema, async (data, issue) => {
  console.log(issue);
  console.log(data);
  const { user, prisma, member } = getRequestEvent().locals;
  if (!user?.memberId || !member?.id) {
    return {
      message: m.notifications_errors_notLoggedIn(),
      type: "error" as const,
    };
  }

  const expense = await prisma.expense.create({
    data: {
      date: new Date(data.date),
      description: data.description,
      isGuildCard: data.isGuildCard ?? false,
      memberId: member.id,
    },
  });
  await updateSignersCacheIfNecessary();
  const itemPromiseResults = await Promise.allSettled(
    data.receipts.map(
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
            user.memberId!,
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
      return {
        message:
          promiseResult.reason instanceof Error
            ? promiseResult.reason.message
            : promiseResult.reason,
        type: "error",
      };
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
    return {
      message: e instanceof Error ? e.message : e,
      type: "error",
    };
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
    getRequestEvent(),
  );
});
