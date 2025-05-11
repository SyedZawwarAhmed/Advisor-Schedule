import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { z } from 'zod';
import { getAvailableTimeSlots, validateSchedulingLink } from '@/lib/availability';
import { add } from 'date-fns';
import { extractLinkedInInfo, augmentAnswerWithContext } from '@/lib/ai-enhancement';
import { createCalendarEvent } from '@/lib/google-calendar';
import { sendMeetingNotificationEmail } from '@/lib/emails';

// Validate available time slots request
const availableTimeSlotsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

// Validate booking request
const answerSchema = z.object({
  questionId: z.string(),
  text: z.string(),
});

const bookingSchema = z.object({
  startTime: z.string(),
  clientEmail: z.string().email(),
  clientLinkedIn: z.string().optional().nullable(),
  answers: z.array(answerSchema),
});

// GET - Get available time slots for a scheduling link
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  try {
    // Validate input
    const result = availableTimeSlotsSchema.safeParse({ startDate, endDate });
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }
    
    // Validate scheduling link
    const { valid, link, reason } = await validateSchedulingLink(slug);
    
    if (!valid || !link) {
      return NextResponse.json(
        { error: reason || 'Invalid scheduling link' },
        { status: 404 }
      );
    }
    
    // Calculate date range
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    // Get available time slots
    const availableSlots = await getAvailableTimeSlots(
      link.userId,
      start,
      end,
      link.duration
    );
    
    // Get questions for this link
    const questions = await prisma.question.findMany({
      where: {
        schedulingLinkId: link.id,
      },
      orderBy: {
        order: 'asc',
      },
    });
    
    return NextResponse.json({
      link: {
        name: link.name,
        duration: link.duration,
      },
      availableSlots,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
      })),
    });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    return NextResponse.json(
      { error: 'Failed to get available time slots' },
      { status: 500 }
    );
  }
}

// POST - Book a meeting
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  
  try {
    // Validate scheduling link
    const { valid, link, reason } = await validateSchedulingLink(slug);
    
    if (!valid || !link) {
      return NextResponse.json(
        { error: reason || 'Invalid scheduling link' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid booking data', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { startTime, clientEmail, clientLinkedIn, answers } = result.data;
    
    // Parse start time and calculate end time
    const meetingStartTime = new Date(startTime);
    const meetingEndTime = add(meetingStartTime, { minutes: link.duration });
    
    // Check if the time slot is still available
    const isAvailable = await getAvailableTimeSlots(
      link.userId,
      meetingStartTime,
      meetingStartTime,
      link.duration
    );
    
    if (isAvailable.length === 0) {
      return NextResponse.json(
        { error: 'The selected time slot is no longer available' },
        { status: 409 }
      );
    }
    
    // Process LinkedIn profile if provided
    let linkedInSummary = null;
    if (clientLinkedIn) {
      try {
        const linkedInInfo = await extractLinkedInInfo(clientLinkedIn, clientEmail);
        linkedInSummary = JSON.stringify(linkedInInfo);
      } catch (error) {
        console.error('Error extracting LinkedIn info:', error);
      }
    }
    
    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        userId: link.userId,
        schedulingLinkId: link.id,
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        clientEmail,
        clientLinkedIn,
        linkedInSummary,
        status: 'scheduled',
      },
    });
    
    // Get the advisor's email
    const advisor = await prisma.user.findUnique({
      where: { id: link.userId },
      select: { email: true },
    });
    
    if (!advisor) {
      throw new Error('Advisor not found');
    }

    // Array to collect questions, answers and augmented answers for the email
    const questionsAndAnswers = [];
    const augmentedAnswersForEmail = [];
    
    // Process and save answers, with AI augmentation
    for (const answer of answers) {
      const questionExists = await prisma.question.findUnique({
        where: {
          id: answer.questionId,
          schedulingLinkId: link.id,
        },
      });
      
      if (questionExists) {
        // Augment answer with AI
        const augmentedAnswer = await augmentAnswerWithContext({
          question: questionExists.text,
          answer: answer.text,
          linkedInInfo: linkedInSummary ? JSON.parse(linkedInSummary) : undefined,
          contactInfo: undefined // Will be fetched in the function
        });
        
        // Save the answer
        await prisma.answer.create({
          data: {
            meetingId: meeting.id,
            questionId: answer.questionId,
            text: answer.text,
            augmentedNote: augmentedAnswer,
          },
        });
        
        // Collect for email
        questionsAndAnswers.push({
          question: questionExists.text,
          text: answer.text,
        });
        augmentedAnswersForEmail.push(augmentedAnswer);
      }
    }
    
    // Increment the usage count for the link
    await prisma.schedulingLink.update({
      where: { id: link.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
    
    // Send notification email to advisor
    try {
      await sendMeetingNotificationEmail({
        advisorEmail: advisor.email,
        clientEmail,
        clientLinkedIn,
        meetingTime: meetingStartTime,
        meetingName: link.name,
        duration: link.duration,
        answers: questionsAndAnswers,
        augmentedAnswers: augmentedAnswersForEmail,
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue with the process even if email fails
    }
    
    // Find the user's calendar accounts to create a calendar event
    const calendarAccounts = await prisma.calendarAccount.findMany({
      where: {
        userId: link.userId,
      },
    });
    
    // Create calendar event if calendar accounts exist
    if (calendarAccounts.length > 0) {
      const primaryAccount = calendarAccounts[0]; // Use the first account
      
      try {
        // Create a nice description with the answers
        let description = `Meeting scheduled with ${clientEmail}\n\n`;
        
        if (clientLinkedIn) {
          description += `LinkedIn: ${clientLinkedIn}\n\n`;
        }
        
        description += 'Responses:\n';
        
        for (const answer of answers) {
          const question = await prisma.question.findUnique({
            where: { id: answer.questionId },
          });
          
          if (question) {
            description += `Q: ${question.text}\nA: ${answer.text}\n\n`;
          }
        }
        
        // Create the event
        await createCalendarEvent(primaryAccount.id, {
          summary: `${link.name} with ${clientEmail}`,
          description,
          start: meetingStartTime,
          end: meetingEndTime,
          attendees: [{ email: clientEmail }],
        });
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Continue with the process even if calendar event creation fails
      }
    }
    
    return NextResponse.json({
      success: true,
      meetingId: meeting.id,
    });
  } catch (error) {
    console.error('Error booking meeting:', error);
    return NextResponse.json(
      { error: 'Failed to book meeting' },
      { status: 500 }
    );
  }
} 