const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Users:');
  const users = await prisma.user.findMany();
  console.log(users);
  
  console.log('Requests:');
  const requests = await prisma.leaveRequest.findMany({ include: { substitute: true } });
  console.log(requests);
}

main().finally(() => process.exit(0));
