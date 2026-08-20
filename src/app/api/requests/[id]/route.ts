import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { action, adminId } = data; // 'ACCEPT_SUB', 'DECLINE_SUB', 'APPROVE_ADMIN', 'REJECT_ADMIN'
    
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { mentor: true }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let newStatus = leaveRequest.status;

    if (action === 'ACCEPT_SUB' && leaveRequest.status === 'PENDING_SUBSTITUTE') {
      newStatus = 'PENDING_ADMIN';
    } else if (action === 'DECLINE_SUB' && leaveRequest.status === 'PENDING_SUBSTITUTE') {
      newStatus = 'REJECTED';
    } else if (action === 'APPROVE_ADMIN' && leaveRequest.status === 'PENDING_ADMIN') {
      if (!adminId) {
        return NextResponse.json({ error: 'Admin ID required for approval' }, { status: 400 });
      }
      
      if (!leaveRequest.firstAdminId) {
        // First admin approval
        const updated = await prisma.leaveRequest.update({
          where: { id },
          data: { firstAdminId: adminId }
        });
        return NextResponse.json({ success: true, status: 'PENDING_ADMIN' });
      } else if (leaveRequest.firstAdminId === adminId) {
        // Same admin trying to approve again
        return NextResponse.json({ error: 'You have already approved this request. Waiting for a second admin.' }, { status: 400 });
      } else {
        // Second admin approval
        newStatus = 'APPROVED';
        // Deduct leave day and increment class leaves
        await prisma.$transaction([
          prisma.user.update({
            where: { id: leaveRequest.mentorId },
            data: { usedLeaveDays: { increment: 1 } }
          }),
          prisma.leaveRequest.update({
            where: { id },
            data: { status: newStatus }
          })
        ]);
        return NextResponse.json({ success: true, status: newStatus });
      }
    } else if (action === 'REJECT_ADMIN' && leaveRequest.status === 'PENDING_ADMIN') {
      newStatus = 'REJECTED';
    } else {
      return NextResponse.json({ error: 'Invalid action or state' }, { status: 400 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: newStatus }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (leaveRequest.status === 'APPROVED') {
      // Refund the leave days and class limit
      await prisma.$transaction([
        prisma.user.update({
          where: { id: leaveRequest.mentorId },
          data: { usedLeaveDays: { decrement: 1 } }
        }),
        prisma.leaveRequest.delete({
          where: { id }
        })
      ]);
    } else {
      // Just delete it if not approved
      await prisma.leaveRequest.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to delete request' }, { status: 500 });
  }
}
