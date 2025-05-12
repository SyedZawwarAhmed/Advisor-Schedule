import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get past meetings (endTime is in the past)
    const now = new Date();
    
    const meetings = await prisma.meeting.findMany({
      where: {
        userId: session.user.id,
        endTime: {
          lt: now,
        },
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
        startTime: 'desc',
      },
      take: 20, // Limit to 20 for now, can be paginated later
    });
    
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching past meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past meetings' },
      { status: 500 }
    );
  }
} 