import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const classes = await prisma.classSession.findMany({
      orderBy: { time: 'asc' },
      where: {
        time: {
          gte: today
        }
      }
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
