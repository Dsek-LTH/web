import type {
  ExtendedPrisma,
  ExtendedPrismaModel,
} from "$lib/server/extendedPrisma";

/** The committee fields needed by the article form and its previews. */
export type CommitteeOption = Pick<
  ExtendedPrismaModel<"Committee">,
  "id" | "name" | "nameSv" | "nameEn" | "shortName" | "symbolUrl"
>;

export const getCommitteeOptions = (
  prisma: ExtendedPrisma,
): Promise<CommitteeOption[]> =>
  prisma.committee.findMany({
    select: {
      id: true,
      name: true,
      nameSv: true,
      nameEn: true,
      shortName: true,
      symbolUrl: true,
    },
  });
