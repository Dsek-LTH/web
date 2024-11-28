import { COST_CENTERS } from "../config";
import type { ReceiptRowSchema, ReceiptSchema } from "./types";
export const createBasicReceiptRow = (): ReceiptRowSchema => ({
  costCenter: COST_CENTERS[0]!.name,
  amount: 0,
  comment: null,
});
const createBasicReceipt = (): ReceiptSchema => ({
  image: null as unknown as File,
  rows: [createBasicReceiptRow()],
});

export default createBasicReceipt;
