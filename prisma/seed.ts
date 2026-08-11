import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  await prisma.leaveRequest.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      username: 'admin',
      password: 'password123',
      role: 'ADMIN',
      totalLeaveDays: 0,
      usedLeaveDays: 0,
    },
  });

  // Create Mentors
  const mentor1 = await prisma.user.create({
    data: {
      name: 'Alice Mentor',
      username: 'alice',
      password: 'password123',
      role: 'MENTOR',
      totalLeaveDays: 10,
      usedLeaveDays: 2,
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      name: 'Bob Mentor',
      username: 'bob',
      password: 'password123',
      role: 'MENTOR',
      totalLeaveDays: 10,
      usedLeaveDays: 0,
    },
  });

  const mentor3 = await prisma.user.create({
    data: {
      name: 'Charlie Mentor',
      username: 'charlie',
      password: 'password123',
      role: 'MENTOR',
      totalLeaveDays: 10,
      usedLeaveDays: 5,
    },
  });

  // Create Classes
  const now = new Date();
  const class1 = await prisma.classSession.create({
    data: {
      time: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      leaveLimit: 1,
      currentLeaves: 0,
    },
  });

  const class2 = await prisma.classSession.create({
    data: {
      time: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
      leaveLimit: 2,
      currentLeaves: 0,
    },
  });

  const class3 = await prisma.classSession.create({
    data: {
      time: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 3 days from now
      leaveLimit: 1,
      currentLeaves: 0,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
