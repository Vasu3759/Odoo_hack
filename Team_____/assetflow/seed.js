const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ path: '.env' });

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    let category = await prisma.assetCategory.findFirst({ where: { name: 'Meeting Rooms' }});
    if (!category) {
      category = await prisma.assetCategory.create({
        data: { name: 'Meeting Rooms' }
      });
    }
    
    const existingAsset = await prisma.asset.findFirst({ where: { tag: 'MR-001' }});
    if (!existingAsset) {
      await prisma.asset.create({
        data: {
          tag: 'MR-001',
          name: 'Conference Room Alpha',
          categoryId: category.id,
          isShared: true
        }
      });
      console.log('Seeded successfully!');
    } else {
      console.log('Asset already seeded!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seed();
