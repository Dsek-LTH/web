import { PrismaClient } from "@prisma/client";

/**
 * @returns A random date between 6 months ago and 6 months from now
 */
function randomDate() {
  const interval = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months
  const start = new Date().getTime() - interval;
  const end = new Date().getTime() + interval;
  return new Date(start + Math.random() * (end - start));
}

/**
 * Insert 10 meetings into the database, S1~S10
 */
export const insertMeetings = async (prisma: PrismaClient) => {
  await prisma.meeting.deleteMany();
  await Promise.all(
    Array.from({ length: 10 })
      .map(randomDate)
      .sort((a, b) => a.getTime() - b.getTime())
      .map((date, i) => {
        const title = "S" + (i + 1).toString().padStart(2, "0");
        return prisma.meeting.create({
          data: {
            title,
            date,
            url: `${date.getFullYear()}/${title}`,
          },
        });
      }),
  );
};
