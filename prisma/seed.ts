import { PrismaClient } from '@prisma/client'
import positionData from "./seed_data/positions"
import apiAccessData from "./seed_data/apiAccess"
import memberData from "./seed_data/members"
import articleData from "./seed_data/articles"

const prisma = new PrismaClient()

async function main() { 
  console.log(`Start seeding ...`)
  await Promise.all([
      prisma.article.deleteMany(),
      prisma.position.deleteMany(),
      prisma.member.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.mandate.deleteMany(),
      prisma.apiAccessPolicy.deleteMany(),
  ]);

    
  await Promise.all(apiAccessData.map((apiAccessPolicy) => prisma.apiAccessPolicy.create({ data: apiAccessPolicy })));
  await Promise.all(positionData.map((position) => prisma.position.create({ data: position })));
  await Promise.all(memberData.map((member) => prisma.member.create({ data: member })));
  await Promise.all(articleData.map((article) => prisma.article.create({ data: article })));
   
  console.log(`Seeding finished.`)
}

await main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })