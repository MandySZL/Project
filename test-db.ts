import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Adding columns...");
    await prisma.$executeRawUnsafe('ALTER TABLE User ADD COLUMN username TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE User ADD COLUMN password TEXT');
    console.log("Columns added!");
  } catch (e) {
    console.error("Error adding columns:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
