import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { z } from 'zod';

// Input validation schema
const questionSchema = z.object({
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

// GET - List scheduling links for the current user
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const schedulingLinks = await prisma.schedulingLink.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            meetings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ links: schedulingLinks });
  } catch (error) {
    console.error('Error fetching scheduling links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling links' },
      { status: 500 }
    );
  }
}

// POST - Create a new scheduling link
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
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
    
    // Check if slug is already taken
    const existingLink = await prisma.schedulingLink.findUnique({
      where: {
        slug,
      },
    });
    
    if (existingLink) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 400 }
      );
    }
    
    // Create scheduling link with questions
    const schedulingLink = await prisma.schedulingLink.create({
      data: {
        name,
        slug,
        isActive,
        duration,
        maxDaysInAdvance,
        usageLimit,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        userId: session.user.id,
        questions: {
          create: questions.map((question, index) => ({
            text: question.text,
            order: index,
          })),
        },
      },
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
      link: schedulingLink,
    });
  } catch (error) {
    console.error('Error creating scheduling link:', error);
    return NextResponse.json(
      { error: 'Failed to create scheduling link' },
      { status: 500 }
    );
  }
}