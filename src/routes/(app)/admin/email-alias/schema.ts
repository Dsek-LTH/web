import { z } from "zod";

export const createEmailPositionSchema = z.object({
  localPartAlias: z.string().toLowerCase(),
  domainAlias: z.string(),
  positionIdAlias: z.string(),
});

export const createEmailSpecialSenderSchema = z.object({
  localPartSender: z.string().toLowerCase(),
  domainSender: z.string(),
  usernameSender: z.string(),
  keycloakIdSender: z.string(),
});

export const createEmailSpecialReceiverSchema = z.object({
  localPartReceiver: z.string().toLowerCase(),
  domainReceiver: z.string(),
  targetEmailReceiver: z.string().email(),
});
