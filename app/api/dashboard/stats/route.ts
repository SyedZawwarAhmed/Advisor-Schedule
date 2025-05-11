import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get total meetings count
    const totalMeetings = await prisma.meeting.count({
      where: {
        userId: session.user.id,
      },
    });

    // Get active scheduling links count
    const activeLinks = await prisma.schedulingLink.count({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    // Get connected calendars count
    const connectedCalendars = await prisma.calendarAccount.count({
      where: {
        userId: session.user.id,
      },
    });

    // Get active scheduling windows count
    const schedulingWindows = await prisma.schedulingWindow.count({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });
    
    return NextResponse.json({
      totalMeetings,
      activeLinks,
      connectedCalendars,
      schedulingWindows,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 