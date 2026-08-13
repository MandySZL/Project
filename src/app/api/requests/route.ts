import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mentorId = searchParams.get('mentorId');
  const substituteId = searchParams.get('substituteId');
  const status = searchParams.get('status');

  try {
    let where: any = {};
    if (mentorId) where.mentorId = mentorId;
    if (substituteId) where.substituteId = substituteId;
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        classSession: true,
        substitute: true,
        mentor: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { mentorId, substituteId, classId } = data;

    // Check leave limits and assigned mentors
    const classSession = await prisma.classSession.findUnique({ 
      where: { id: classId },
      include: { assignedMentors: true }
    });
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    
    // Check if the mentor requesting leave is actually an active substitute for this class
    const isActiveSubstitute = await prisma.leaveRequest.findFirst({
      where: {
        substituteId: mentorId,
        classId: classId,
        status: { in: ['PENDING_ADMIN', 'APPROVED'] }
      }
    });
    if (isActiveSubstitute) {
      return NextResponse.json({ error: 'You have accepted to be a substitute for this class, you cannot request leave.' }, { status: 400 });
    }

    if (classSession.assignedMentors.some(m => m.id === substituteId)) {
      return NextResponse.json({ error: 'Substitute is already assigned to teach this session' }, { status: 400 });
    }

    // Check if substitute is already requested/approved for this class session in another leave request
    const existingSubRequest = await prisma.leaveRequest.findFirst({
      where: {
        substituteId,
        classId,
        status: {
          in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });
    if (existingSubRequest) {
      return NextResponse.json({ error: 'This mentor has already been requested to substitute for this session' }, { status: 400 });
    }

    if (classSession.currentLeaves >= classSession.leaveLimit) {
      return NextResponse.json({ error: 'Leave limit reached for this class' }, { status: 400 });
    }

    // Check for self-substitution
    if (mentorId === substituteId) {
      return NextResponse.json({ error: 'You cannot select yourself as a substitute' }, { status: 400 });
    }

    // Check for existing active request
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        mentorId,
        classId,
        status: {
          in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have an active leave request for this session' }, { status: 400 });
    }

    // Create request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        mentorId,
        substituteId,
        classId,
        status: 'PENDING_SUBSTITUTE'
      }
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
