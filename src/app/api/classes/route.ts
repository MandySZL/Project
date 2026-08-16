import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = await prisma.classSession.findMany({
      orderBy: { time: 'asc' },
      where: {
        time: {
          gt: new Date()
        }
      }
    });
    return NextResponse.json(classes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
