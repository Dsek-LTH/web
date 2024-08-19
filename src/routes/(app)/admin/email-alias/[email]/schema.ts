import type { Infer } from "sveltekit-superforms";
import { z } from "zod";

export const addPositionSchema = z.object({
  email: z.string(),
  positionId: z.string(),
});

export const removePositionSchema = z.object({
  aliasId: z.string(),
});

export type RemovePositionForm = Infer<typeof removePositionSchema>;

export const deleteEmailAliasSchema = z.object({
  email: z.string(),
});

export const setCanSendSchema = z.object({
  aliasId: z.string(),
  canSend: z.boolean(),
});

export type SetCanSendForm = Infer<typeof setCanSendSchema>;

export const addSpecialReceiverSchema = z.object({
  email: z.string(),
  targetEmailReceiver: z.string().email(),
});

export const removeSpecialReceiverSchema = z.object({
  id: z.string(),
  targetEmailReceiver: z.string().email(),
});

export type RemoveSpecialReceiverForm = Infer<
  typeof removeSpecialReceiverSchema
>;

export const deleteSpecialReceiverSchema = z.object({
  email: z.string(),
});

export const addSpecialSenderSchema = z.object({
  email: z.string(),
  usernameSender: z.string(),
});

export const removeSpecialSenderSchema = z.object({
  id: z.string(),
});

export type RemoveSpecialSenderForm = Infer<typeof removeSpecialSenderSchema>;

export const deleteSpecialSenderSchema = z.object({
  email: z.string(),
});
