import { isFileImage, isFilePDF } from "$lib/files/utils";
import { type Infer } from "sveltekit-superforms";
import { z } from "zod";
import { isValidCostCenter } from "./config";

const itemSchema = z.object({
  costCenter: z.string().refine(isValidCostCenter, {
    message: "Ogiltigt kostnadscenter",
  }),
  amount: z.number(),
  comment: z.string().nullable(),
});
const receiptSchema = z.object({
  image: z
    .instanceof(File, { message: "Please upload a file" })
    .refine((file) => !file || isFileImage(file) || isFilePDF(file), {
      message: "Måste vara en bild eller PDF",
    }),
  rows: z.array(itemSchema).nonempty(),
});

export const expenseSchema = z.object({
  date: z.date(),
  description: z.string(),
  isGuildCard: z.boolean(),
  receipts: z.array(receiptSchema).nonempty(),
});

export const updateExpenseSchema = expenseSchema
  .omit({
    receipts: true,
  })
  .merge(
    z.object({
      items: z.array(
        itemSchema.merge(
          z.object({
            itemId: z.string().uuid().nullable(),
          }),
        ),
      ),
    }),
  );
export type UpdateExpenseSchema = Infer<typeof updateExpenseSchema>;

export type ExpenseSchema = Infer<typeof expenseSchema>;
export type ReceiptSchema = ExpenseSchema["receipts"][number];
export type ReceiptRowSchema = ReceiptSchema["rows"][number];
