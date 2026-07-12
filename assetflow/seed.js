const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Seed 3 Departments
    const deptNames = ['HR', 'Finance', 'IT'];
    const depts = [];
    for (const name of deptNames) {
      let dept = await prisma.department.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      depts.push(dept);
    }

    // 2. Seed 10 Categories
    const categoryNames = ['Laptops', 'Monitors', 'Keyboards', 'Mice', 'Phones', 'Servers', 'Desks', 'Chairs', 'Projectors', 'Vehicles'];
    const categories = [];
    for (const name of categoryNames) {
      let cat = await prisma.assetCategory.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      categories.push(cat);
    }

    // 3. Seed 9 Employees per Department (27 total)
    // All users will have the password "password123"
    const hash = await bcrypt.hash('password123', 10);
    
    for (const dept of depts) {
      // 1 Department Head
      await prisma.user.upsert({
        where: { email: `head.${dept.name.toLowerCase()}@example.com` },
        update: {},
        create: { 
          name: `${dept.name} Head`, 
          email: `head.${dept.name.toLowerCase()}@example.com`, 
          passwordHash: hash, 
          role: 'DEPT_HEAD', 
          departmentId: dept.id 
        }
      });
      
      // 1 Asset Manager
      await prisma.user.upsert({
        where: { email: `manager.${dept.name.toLowerCase()}@example.com` },
        update: {},
        create: { 
          name: `${dept.name} Asset Manager`, 
          email: `manager.${dept.name.toLowerCase()}@example.com`, 
          passwordHash: hash, 
          role: 'ASSET_MANAGER', 
          departmentId: dept.id 
        }
      });

      // 7 Regular Employees
      for (let i = 1; i <= 7; i++) {
        await prisma.user.upsert({
          where: { email: `emp${i}.${dept.name.toLowerCase()}@example.com` },
          update: {},
          create: { 
            name: `${dept.name} Employee ${i}`, 
            email: `emp${i}.${dept.name.toLowerCase()}@example.com`, 
            passwordHash: hash, 
            role: 'EMPLOYEE', 
            departmentId: dept.id 
          }
        });
      }
    }

    // 4. Seed 10 Assets
    for (let i = 0; i < 10; i++) {
       const cat = categories[i];
       // Tag format: e.g., AST-001
       const tag = `AST-00${i + 1}`;
       await prisma.asset.upsert({
          where: { tag },
          update: {},
          create: {
             tag,
             name: `Sample ${cat.name} ${i + 1}`,
             categoryId: cat.id,
             status: 'AVAILABLE'
          }
       });
    }

    console.log('Successfully seeded: 3 Departments, 10 Categories, 27 Employees, and 10 Assets for demonstration.');

  } catch (e) {
    console.error('Error seeding data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
