import { PrismaClient } from '../generated/prisma';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  let globalWithPrisma = global as typeof globalThis & {
    prismaClient: PrismaClient;
  };
  if (!globalWithPrisma.prismaClient) {
    globalWithPrisma.prismaClient = new PrismaClient();
  }
  prisma = globalWithPrisma.prismaClient;
}

export default prisma;
