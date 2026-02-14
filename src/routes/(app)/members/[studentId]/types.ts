import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";
import * as m from "$paraglide/messages";
import type { Infer } from "sveltekit-superforms/server";
import { z } from "zod";

export type MandateWithPositionAndCommitte = Pick<
  ExtendedPrismaModel<"Mandate">,
  "id" | "startDate" | "endDate"
> & {
  phadderIn: ExtendedPrismaModel<"PhadderGroup"> | null;
  position: Pick<ExtendedPrismaModel<"Position">, "id" | "name"> & {
    committee: Pick<
      ExtendedPrismaModel<"Committee">,
      "name" | "lightImageUrl" | "darkImageUrl" | "monoImageUrl" | "symbolUrl"
    > | null;
  };
};

export const uploadPictureSchema = z.object({
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
export const deletePictureSchema = z.object({
  fileName: z.string(),
});
export type DeletePictureSchema = Infer<typeof deletePictureSchema>;
