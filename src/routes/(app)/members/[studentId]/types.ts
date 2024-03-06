import type { Committee, Mandate, Position } from "@prisma/client";

export type MandateWithPositionAndCommitte = Pick<
  Mandate,
  "id" | "startDate" | "endDate"
> & {
  position: Pick<Position, "id" | "name"> & {
    committee: Pick<Committee, "name" | "imageUrl"> | null;
  };
};
