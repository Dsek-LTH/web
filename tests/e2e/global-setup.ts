import { E2E_PREFIX, prisma } from "./helpers";

/** Removes what earlier runs left behind, in case of a shared dev database. */
export default async function globalSetup() {
  await prisma.accessPolicy.deleteMany({
    where: { role: { startsWith: E2E_PREFIX } },
  });
  await prisma.member.deleteMany({
    where: { studentId: { startsWith: E2E_PREFIX } },
  });
  await prisma.$disconnect();
}
