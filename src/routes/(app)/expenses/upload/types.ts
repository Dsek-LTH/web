import { isFileImage, isFilePDF } from "$lib/files/utils";
import { type Infer } from "sveltekit-superforms";
import { z } from "zod";
import { isValidCostCenter } from "../config";

// bank details: clearing, bank account, bank name
export const expenseSchema = z.object({
  date: z.date(),
  description: z.string(),
  isGuildCard: z.boolean(),
  receipts: z
    .array(
      z.object({
        image: z
          .instanceof(File, { message: "Please upload a file" })
          .refine((file) => !file || isFileImage(file) || isFilePDF(file), {
            message: "Måste vara en bild eller PDF",
          }),
        rows: z
          .array(
            z.object({
              costCenter: z.string().refine(isValidCostCenter, {
                message: "Ogiltigt kostnadscenter",
              }),
              amount: z.number(),
              comment: z.string().nullable(),
            }),
          )
          .nonempty(),
      }),
    )
    .nonempty(),
});

export type ExpenseSchema = Infer<typeof expenseSchema>;
export type ReceiptSchema = ExpenseSchema["receipts"][number];
export type ReceiptRowSchema = ReceiptSchema["rows"][number];
