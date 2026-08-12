import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { role: 'asc' } // Admins first usually
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Default leave days based on role
    const totalLeaveDays = role === 'MENTOR' ? 10 : 0;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        totalLeaveDays,
        usedLeaveDays: 0,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error(error);
    // Handle potential unique constraint errors (e.g., email already exists)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
