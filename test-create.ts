const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const s = await prisma.classSession.create({
      data: {
        dayOfWeek: 1,
        timeString: '10:00',
        endTimeString: '11:00',
        venue: 'Test',
        leaveLimit: 2
      }
    });
    console.log('Success:', s);
  } catch(e: any) {
    console.error('Error:', e.message);
  }
}
main();
