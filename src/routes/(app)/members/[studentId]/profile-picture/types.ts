import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export const changeSchema = z.object({
	url: z.string().url(),
});
export type ChangeSchema = Infer<typeof changeSchema>;
export const uploadSchema = z.object({
	image: z
		.instanceof(File, { message: m.members_errors_invalidPicture() })
		.refine((f) => f.size > 0, {
			message: m.members_errors_invalidPicture(),
		})
		.refine(
			(f) => f.size < 8_000_000,
			m.members_errors_tooLargePicture({ size: "8MB" }),
		),
	cropWidth: z.number().min(0).default(0),
	cropHeight: z.number().min(0).default(0),
	cropX: z.number().min(0).default(0),
	cropY: z.number().min(0).default(0),
});
export const deleteSchema = z.object({
	fileName: z.string(),
});
export type DeleteSchema = Infer<typeof deleteSchema>;
