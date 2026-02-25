import type { ReceiptRowSchema, ReceiptSchema } from "./types";
export const createBasicReceiptRow = (costCenter: string | null = null) =>
	({
		costCenter,
		amount: 0,
		comment: null,
	}) as ReceiptRowSchema;
const createBasicReceipt = (): ReceiptSchema => ({
	image: null as unknown as File,
	rows: [createBasicReceiptRow()],
});

export default createBasicReceipt;
