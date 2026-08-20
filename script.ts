import prisma from './src/lib/prisma';

async function main() {
  console.log('Users:');
  const users = await prisma.user.findMany();
  console.log(users);
  
  console.log('Class Sessions:');
  const classes = await prisma.classSession.findMany();
  console.log(classes);
}

main().finally(() => process.exit(0));
