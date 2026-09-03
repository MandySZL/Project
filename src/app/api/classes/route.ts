import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = await prisma.classSession.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeString: 'asc' }
      ]
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { dayOfWeek, timeString, endTimeString, venue, leaveLimit } = data;

    if (dayOfWeek === undefined || !timeString || !endTimeString) {
      return NextResponse.json({ error: 'dayOfWeek, timeString and endTimeString are required' }, { status: 400 });
    }

    const newClass = await prisma.classSession.create({
      data: {
        dayOfWeek: Number(dayOfWeek),
        timeString,
        endTimeString,
        venue: venue || 'TBD',
        leaveLimit: leaveLimit !== undefined ? leaveLimit : 2,
      }
    });

    return NextResponse.json(newClass);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to create class' }, { status: 500 });
  }
}
