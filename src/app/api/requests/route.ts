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
    const { mentorId, substituteId, requestDate, sessionText } = data;

    if (mentorId === substituteId) {
      return NextResponse.json({ error: 'You cannot select yourself as a substitute' }, { status: 400 });
    }

    const parsedDate = new Date(requestDate);
    // Find all classes on this date to get the total daily limit
    const startOfDay = new Date(parsedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const classesOnDate = await prisma.classSession.findMany({
      where: {
        time: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const totalLimit = classesOnDate.reduce((sum, c) => sum + c.leaveLimit, 0);

    // Count existing approved/pending requests for this date
    const existingDateRequestsCount = await prisma.leaveRequest.count({
      where: {
        requestDate: parsedDate,
        status: { in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED'] }
      }
    });

    if (existingDateRequestsCount >= totalLimit) {
      return NextResponse.json({ error: 'No more leave slots available for this date' }, { status: 400 });
    }

    // Check if mentor already requested this exact session on this date
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        mentorId,
        requestDate: parsedDate,
        sessionText,
        status: {
          in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have an active leave request for this session on this date' }, { status: 400 });
    }

    // Prevent requesting leave if the mentor is already acting as a substitute on the same day
    const isSubstituting = await prisma.leaveRequest.findFirst({
      where: {
        substituteId: mentorId,
        requestDate: parsedDate,
        status: {
          in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });

    if (isSubstituting) {
      return NextResponse.json({ error: 'You cannot request leave on a day you are already scheduled to substitute for someone else.' }, { status: 400 });
    }

    // Prevent selecting a substitute who has already requested leave on the same day
    const substituteOnLeave = await prisma.leaveRequest.findFirst({
      where: {
        mentorId: substituteId,
        requestDate: parsedDate,
        status: {
          in: ['PENDING_SUBSTITUTE', 'PENDING_ADMIN', 'APPROVED']
        }
      }
    });

    if (substituteOnLeave) {
      return NextResponse.json({ error: 'The selected substitute already has a leave request on this date.' }, { status: 400 });
    }

    // Create request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        mentorId,
        substituteId,
        requestDate: parsedDate,
        sessionText,
        status: 'PENDING_SUBSTITUTE'
      }
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
