import type {
  Committee,
  Mandate,
  PhadderGroup,
  Position,
} from "@prisma/client";

export type MandateWithPositionAndCommitte = Pick<
  Mandate,
  "id" | "startDate" | "endDate"
> & {
  phadderIn: PhadderGroup | null;
  position: Pick<Position, "id" | "name"> & {
    committee: Pick<
      Committee,
      "name" | "lightImageUrl" | "darkImageUrl" | "monoImageUrl" | "symbolUrl"
    > | null;
  };
};
