import { PrismaClient } from "@prisma/client";

const committeesWithImages = ["cafe", "aktu", "infu", "skattm", "srd", "sexm"];
export const insertCommitteeLogos = async (prisma: PrismaClient) => {
  await Promise.all(
    committeesWithImages.map((shortName) =>
      prisma.committee.updateMany({
        where: {
          shortName,
          imageUrl: null,
        },
        data: {
          imageUrl: `minio/material/committees/${shortName}.svg`,
        },
      })
    )
  );
};
