import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Input validation schema
const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
});

const schedulingLinkSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  isActive: z.boolean(),
  duration: z.number().min(1),
  maxDaysInAdvance: z.number().min(1),
  usageLimit: z.number().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  questions: z.array(questionSchema),
});

// GET - Get a single scheduling link by ID
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
    const schedulingLink = await prisma.schedulingLink.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        meetings: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            clientEmail: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            startTime: 'desc',
          },
        },
      },
    });
    
    if (!schedulingLink) {
      return NextResponse.json({ error: 'Scheduling link not found' }, { status: 404 });
    }
    
    return NextResponse.json({ link: schedulingLink });
  } catch (error) {
    console.error('Error fetching scheduling link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling link' },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing scheduling link
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
    // Check if link exists and belongs to user
    const existingLink = await prisma.schedulingLink.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        questions: true,
      },
    });
    
    if (!existingLink) {
      return NextResponse.json({ error: 'Scheduling link not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // Validate input
    const result = schedulingLinkSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const {
      name,
      slug,
      isActive,
      duration,
      maxDaysInAdvance,
      usageLimit,
      expirationDate,
      questions,
    } = result.data;
    
    // Check if the updated slug is already taken by another link
    if (slug !== existingLink.slug) {
      const slugExists = await prisma.schedulingLink.findUnique({
        where: { slug },
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 400 }
        );
      }
    }
    
    // Get existing question IDs
    const existingQuestionIds = existingLink.questions.map(q => q.id);
    
    // Create transactions to update the link and questions
    await prisma.$transaction(async (tx) => {
      // Update the link
      await tx.schedulingLink.update({
        where: { id },
        data: {
          name,
          slug,
          isActive,
          duration,
          maxDaysInAdvance,
          usageLimit,
          expirationDate: expirationDate ? new Date(expirationDate) : null,
        },
      });
      
      // Delete questions that are not in the updated list
      const updatedQuestionIds = questions
        .filter(q => q.id)
        .map(q => q.id as string);
      
      const questionIdsToDelete = existingQuestionIds.filter(
        id => !updatedQuestionIds.includes(id)
      );
      
      if (questionIdsToDelete.length > 0) {
        await tx.question.deleteMany({
          where: {
            id: { in: questionIdsToDelete },
          },
        });
      }
      
      // Update existing questions and create new ones
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (question.id) {
          await tx.question.update({
            where: { id: question.id },
            data: {
              text: question.text,
              order: i,
            },
          });
        } else {
          // Create new question
          await tx.question.create({
            data: {
              schedulingLinkId: id,
              text: question.text,
              order: i,
            },
          });
        }
      }
    });
    
    // Get the updated link
    const updatedLink = await prisma.schedulingLink.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      link: updatedLink,
    });
  } catch (error) {
    console.error('Error updating scheduling link:', error);
    return NextResponse.json(
      { error: 'Failed to update scheduling link' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a scheduling link
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const id = (await params).id;
  
  try {
    // Check if link exists and belongs to user
    const existingLink = await prisma.schedulingLink.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingLink) {
      return NextResponse.json({ error: 'Scheduling link not found' }, { status: 404 });
    }
    
    // Check if link has any meetings
    const meetingsCount = await prisma.meeting.count({
      where: {
        schedulingLinkId: id,
      },
    });
    
    if (meetingsCount > 0) {
      // Instead of deleting, just mark as inactive
      await prisma.schedulingLink.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Scheduling link deactivated (has existing meetings)',
      });
    }
    
    // Delete the link (questions will be cascade deleted)
    await prisma.schedulingLink.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Scheduling link deleted',
    });
  } catch (error) {
    console.error('Error deleting scheduling link:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduling link' },
      { status: 500 }
    );
  }
} 