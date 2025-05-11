import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Input validation schema
const timeSlotSchema = z.object({
  dayOfWeek: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const schedulingWindowSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean(),
  timeSlots: z.array(timeSlotSchema),
});

// GET - List scheduling windows for the current user
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const schedulingWindows = await prisma.schedulingWindow.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        timeSlots: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ windows: schedulingWindows });
  } catch (error) {
    console.error('Error fetching scheduling windows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling windows' },
      { status: 500 }
    );
  }
}

// POST - Create a new scheduling window
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Validate input
    const result = schedulingWindowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { name, isActive, timeSlots } = result.data;
    
    // Create scheduling window with time slots
    const schedulingWindow = await prisma.schedulingWindow.create({
      data: {
        name,
        isActive,
        userId: session.user.id,
        timeSlots: {
          create: timeSlots.map((slot, index) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        },
      },
      include: {
        timeSlots: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      window: schedulingWindow,
    });
  } catch (error) {
    console.error('Error creating scheduling window:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduling window' },
      { status: 500 }
    );
  }
} 