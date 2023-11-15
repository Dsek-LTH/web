import { z } from "zod";

export const governingDocumetSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  documentType: z.string(),
});
export type GoverningDocumentSchema = typeof governingDocumetSchema;
