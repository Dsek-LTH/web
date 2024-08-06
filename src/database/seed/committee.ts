import { PrismaClient } from "@prisma/client";

const committeesWithImages = [
  "cafe",
  "aktu",
  "infu",
  "skattm",
  "srd",
  "sexm",
  "km",
];
export const insertCommitteeLogos = async (prisma: PrismaClient) => {
  await Promise.all(
    committeesWithImages.map((shortName) =>
      prisma.committee.updateMany({
        where: {
          shortName,
          OR: [
            {
              darkImageUrl: null,
            },
            {
              lightImageUrl: null,
            },
            {
              monoImageUrl: null,
            },
            {
              symbolUrl: null,
            },
          ],
        },
        data: {
          darkImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/dark.svg`,
          lightImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/light.svg`,
          monoImageUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/full/bw.svg`,
          symbolUrl: `https://raw.githubusercontent.com/Dsek-LTH/grafik/main/committee_logos/${shortName}/SVG/symbol/dark.svg`,
        },
      }),
    ),
  );
};
