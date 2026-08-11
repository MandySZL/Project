import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { totalLeaveDays } = data;
    
    if (typeof totalLeaveDays !== 'number' || totalLeaveDays < 0) {
      return NextResponse.json({ error: 'Invalid leave days' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { totalLeaveDays }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}
