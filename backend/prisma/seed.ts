import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('Database already contains users. Skipping seeding to preserve existing data.');
    return;
  }

  console.log('Database is empty. Seeding admin user Kyle...');
  await prisma.user.create({
    data: {
      studentId: 'Kyle',
      name: 'Kyle',
      password: 'Kyle16',
      role: 'ADMIN',
      isVerified: true,
      trustScore: 200,
    },
  });

  console.log('Admin user Kyle seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
