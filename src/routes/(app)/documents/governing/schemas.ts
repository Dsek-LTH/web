import { z } from "zod";

export const governingDocumentSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  type: z.enum(["POLICY", "GUIDELINE"]),
});
export type GoverningDocumentSchema = typeof governingDocumentSchema;
