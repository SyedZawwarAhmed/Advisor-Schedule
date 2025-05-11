import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get meetings for the next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const meetings = await prisma.meeting.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'scheduled',
      },
      include: {
        schedulingLink: {
          select: {
            name: true,
            duration: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming meetings' },
      { status: 500 }
    );
  }
} 