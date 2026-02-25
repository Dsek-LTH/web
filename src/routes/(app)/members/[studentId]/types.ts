import type { ExtendedPrismaModel } from "$lib/server/extendedPrisma";

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
