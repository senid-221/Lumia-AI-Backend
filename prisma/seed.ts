import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'owner@example.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  console.log('No seed user created automatically. Create the first account through /api/auth/signup.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
