import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Input validation schema
const timeSlotSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const schedulingWindowSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean(),
  timeSlots: z.array(timeSlotSchema),
});

// GET - Get a single scheduling window by ID
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
    const schedulingWindow = await prisma.schedulingWindow.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        timeSlots: true,
      },
    });
    
    if (!schedulingWindow) {
      return NextResponse.json({ error: 'Scheduling window not found' }, { status: 404 });
    }
    
    return NextResponse.json({ window: schedulingWindow });
  } catch (error) {
    console.error('Error fetching scheduling window:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling window' },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing scheduling window
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Check if window exists and belongs to user
    const existingWindow = await prisma.schedulingWindow.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        timeSlots: true,
      },
    });
    
    if (!existingWindow) {
      return NextResponse.json({ error: 'Scheduling window not found' }, { status: 404 });
    }
    
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
    
    // Get existing time slot IDs
    const existingTimeSlotIds = existingWindow.timeSlots.map(slot => slot.id);
    
    // Create transactions to update the window and time slots
    await prisma.$transaction(async (tx) => {
      // Update the window
      await tx.schedulingWindow.update({
        where: { id },
        data: {
          name,
          isActive,
        },
      });
      
      // Delete time slots that are not in the updated list
      const updatedTimeSlotIds = timeSlots
        .filter(slot => slot.id)
        .map(slot => slot.id as string);
      
      const timeSlotIdsToDelete = existingTimeSlotIds.filter(
        id => !updatedTimeSlotIds.includes(id)
      );
      
      if (timeSlotIdsToDelete.length > 0) {
        await tx.timeSlot.deleteMany({
          where: {
            id: { in: timeSlotIdsToDelete },
          },
        });
      }
      
      // Update existing time slots
      for (const slot of timeSlots) {
        if (slot.id) {
          await tx.timeSlot.update({
            where: { id: slot.id },
            data: {
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          });
        } else {
          // Create new time slots
          await tx.timeSlot.create({
            data: {
              schedulingWindowId: id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          });
        }
      }
    });
    
    // Get the updated window
    const updatedWindow = await prisma.schedulingWindow.findUnique({
      where: { id },
      include: {
        timeSlots: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      window: updatedWindow,
    });
  } catch (error) {
    console.error('Error updating scheduling window:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduling window' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduling window
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Check if window exists and belongs to user
    const existingWindow = await prisma.schedulingWindow.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingWindow) {
      return NextResponse.json({ error: 'Scheduling window not found' }, { status: 404 });
    }
    
    // Delete the window (time slots will be cascade deleted)
    await prisma.schedulingWindow.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Scheduling window deleted',
    });
  } catch (error) {
    console.error('Error deleting scheduling window:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduling window' },
      { status: 500 }
    );
  }
} 