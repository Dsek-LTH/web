import { isFileImage, isFilePDF } from "$lib/files/utils";
import type { Infer } from "sveltekit-superforms";
import { z } from "zod";
import { isValidCostCenter } from "./config";

const itemSchema = z.object({
	costCenter: z
		.string({ message: "Välj kostnadsställe" })
		.refine(isValidCostCenter, { message: "Ogiltigt kostnadscenter" }),
	amount: z.number(),
	comment: z.string().nullable(),
});
const receiptSchema = z.object({
	image: z
		.instanceof(File, { message: "Please upload a file" })
		.refine((file) => isFilePDF(file) || isFileImage(file), {
			message: "Måste vara en PDF eller bild",
		}),
	rows: z.array(itemSchema).nonempty(),
});

export const expenseSchema = z.object({
	date: z.date(),
	description: z.string(),
	isGuildCard: z.boolean(),
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
