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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { time, leaveLimit } = data;

    if (!time) {
      return NextResponse.json({ error: 'Time is required' }, { status: 400 });
    }

    const newClass = await prisma.classSession.create({
      data: {
        time: new Date(time),
        leaveLimit: leaveLimit !== undefined ? leaveLimit : 0,
        currentLeaves: 0,
      }
    });

    return NextResponse.json(newClass);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to create class' }, { status: 500 });
  }
}
