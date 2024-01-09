import { PrismaClient } from "@prisma/client";
import { insertCommitteeLogos } from "./committee";
import { insertAccessPolicies } from "./accessPolicies";
import { insertProducts } from "./products";
import { insertMeetings } from "./meetings";
import { insertMarkdowns } from "./markdowns";

const prisma = new PrismaClient();

/**
 * Calls all seed functions.
 *
 * Should be idempotent, meaning that it can be called multiple times,
 * without changing the result, or at the very least without crashing.
 */
async function main() {
  await Promise.all([
    insertCommitteeLogos(prisma),
    insertAccessPolicies(prisma),
    insertProducts(prisma),
    insertMeetings(prisma),
    insertMarkdowns(prisma),
  ]);
}

await main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
