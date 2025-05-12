import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        schedulingLink: {
          select: {
            name: true,
            duration: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            question: {
              order: 'asc',
            },
          },
        },
      },
    });
    
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    
    // Parse LinkedIn summary if it exists
    let linkedInSummary = null;
    if (meeting.linkedInSummary) {
      try {
        linkedInSummary = JSON.parse(meeting.linkedInSummary);
      } catch (error) {
        console.error('Error parsing LinkedIn summary:', error);
      }
    }
    
    return NextResponse.json({ 
      meeting: {
        ...meeting,
        linkedInSummary
      }
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
} 