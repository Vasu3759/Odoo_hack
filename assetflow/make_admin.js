const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function createAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const email = 'admin@gmail.com';
    const password = 'admin'; // User actually asked for "admin 123" but typed "admin 123" so I'll use "admin123" 
    const hash = await bcrypt.hash('admin123', 10);

    const existingAdmin = await prisma.user.findUnique({ where: { email } });

    if (existingAdmin) {
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN', passwordHash: hash }
      });
      console.log('Updated existing admin@gmail.com with new password and ADMIN role.');
    } else {
      await prisma.user.create({
        data: {
          name: 'System Admin',
          email,
          passwordHash: hash,
          role: 'ADMIN'
        }
      });
      console.log('Created new admin@gmail.com with password admin123 and ADMIN role.');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
createAdmin();
