import prisma from './src/lib/prisma';

async function main() {
  const requestsToDelete = await prisma.leaveRequest.findMany({
    where: {
      OR: [
        { mentor: { email: { endsWith: '@chmbaka.com' } } },
        { substitute: { email: { endsWith: '@chmbaka.com' } } }
      ]
    }
  });
  
  if (requestsToDelete.length > 0) {
    console.log(`Deleting ${requestsToDelete.length} leave requests...`);
    await prisma.leaveRequest.deleteMany({
      where: {
        id: { in: requestsToDelete.map(r => r.id) }
      }
    });
  }

  const usersToDelete = await prisma.user.findMany({
    where: { email: { endsWith: '@chmbaka.com' } }
  });

  if (usersToDelete.length > 0) {
    console.log(`Deleting ${usersToDelete.length} users...`);
    await prisma.user.deleteMany({
      where: { id: { in: usersToDelete.map(u => u.id) } }
    });
  }

  console.log('Done!');
}

main().finally(() => process.exit(0));
