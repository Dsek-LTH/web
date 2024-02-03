import { z } from "zod";

export const createEmailPositionSchema = z.object({
  localPart: z.string().toLowerCase(),
  domain: z.string(),
  positionId: z.string(),
});

export const createEmailSpecialSenderSchema = z.object({
  localPart: z.string().toLowerCase(),
  domain: z.string(),
  username: z.string(),
  keycloakId: z.string(),
});

export const createEmailSpecialReceiverSchema = z.object({
  localPart: z.string().toLowerCase(),
  domain: z.string(),
  targetEmail: z.string().email(),
});
