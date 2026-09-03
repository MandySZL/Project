import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { leaveLimit } = data;
    
    if (leaveLimit !== undefined && (typeof leaveLimit !== 'number' || leaveLimit < 0)) {
      return NextResponse.json({ error: 'Invalid leave limit' }, { status: 400 });
    }

    const currentSession = await prisma.classSession.findUnique({
      where: { id }
    });

    if (!currentSession) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (leaveLimit !== undefined) updateData.leaveLimit = leaveLimit;
    
    // Removed assignedMentors update logic

    const updated = await prisma.classSession.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to update class session' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.classSession.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to delete class session' }, { status: 500 });
  }
}

