import { PrismaClient } from "@prisma/client";
import { insertCommitteeLogos } from "./seed_data/committee";
import { insertAccessPolicies } from "./seed_data/accessPolicies";
import { insertProducts } from "./seed_data/products";
import { insertMeetings } from "./seed_data/meetings";
import { insertMarkdowns } from "./seed_data/markdowns";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  await Promise.all([
    insertCommitteeLogos(prisma),
    insertAccessPolicies(prisma),
    insertProducts(prisma),
    insertMeetings(prisma),
    insertMarkdowns(prisma),
  ]);
  console.log(`Seeding finished.`);
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
