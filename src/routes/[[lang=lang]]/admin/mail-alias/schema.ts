import { z } from "zod";

export const createEmailPositionSchema = z.object({
  localPart: z.string(),
  domain: z.string(),
  positionId: z.string(),
});

export type CreateEmailPosition = z.infer<typeof createEmailPositionSchema>;

export const createEmailSpecialSenderSchema = z.object({
  localPart: z.string(),
  domain: z.string(),
  username: z.string(),
});
