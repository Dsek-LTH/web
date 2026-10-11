import { isFileImage, isFilePDF } from "$lib/files/utils";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { isValidCostCenter } from "./config";
import * as messages from "$paraglide/messages";

const itemSchema = z.object({
  costCenter: z
    .string({ message: messages.expenses_choose_cost_centre() })
    .refine(isValidCostCenter, {
      message: messages.expenses_invalid_cost_centre(),
    }),
  amount: z.number(),
  comment: z.string().optional(),
});
const receiptSchema = z.object({
  image: z
    .instanceof(File, { message: messages.file_upload_please() })
    .refine((file) => isFilePDF(file) || isFileImage(file), {
      message: messages.file_upload_must_be_an_image_or_pdf(),
    }),
  rows: z.array(itemSchema).nonempty(),
});

export const expenseSchema = z.object({
  date: z.string(),
  description: z.string(),
  isGuildCard: z.boolean().default(false).optional(),
  receipts: z.array(receiptSchema).nonempty(),
});
export type ExpenseSchema = Infer<typeof expenseSchema>;
export type ReceiptSchema = ExpenseSchema["receipts"][number];
export type ReceiptRowSchema = ReceiptSchema["rows"][number];

export const updateExpenseSchema = expenseSchema.omit({
  receipts: true,
});
export type UpdateExpenseSchema = Infer<typeof updateExpenseSchema>;

export const updateItemSchema = itemSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);
export type UpdateItemSchema = Infer<typeof updateItemSchema>;
