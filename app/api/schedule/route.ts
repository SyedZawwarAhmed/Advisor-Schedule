import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/prisma"
import { validateSchedulingLink } from "@/lib/availability"
import { createCalendarEvent } from "@/lib/google-calendar"
import { getContactDetails  } from "@/lib/hubspot-crm"
import { extractLinkedInInfo, augmentAnswerWithContext } from "@/lib/ai-enhancement"
import { sendConfirmationEmail, sendAdvisorNotification } from "@/lib/email"

// Validate booking request
const answerSchema = z.object({
  questionId: z.string(),
  text: z.string(),
})

const bookingSchema = z.object({
  startTime: z.string(),
  clientEmail: z.string().email(),
  clientLinkedIn: z.string().optional().nullable(),
  answers: z.array(answerSchema),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate request data
    const result = bookingSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      )
    }

    const { startTime, clientEmail, clientLinkedIn, answers } = result.data

    // Extract link slug from request URL (e.g., /api/schedule/link-slug)
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const slug = pathParts[pathParts.length - 1]

    // Validate link and get details
    const { valid, link, reason } = await validateSchedulingLink(slug)
    if (!valid || !link) {
      return NextResponse.json(
        { error: reason || "Invalid scheduling link" },
        { status: 404 }
      )
    }

    // Calculate meeting end time
    const start = new Date(startTime)
    const end = new Date(start.getTime() + link.duration * 60000)

    // First try to find contact in HubSpot
    let contactInfo = null
    try {
      contactInfo = await getContactDetails({
        email: clientEmail
      })
    } catch (error) {
      console.error("Error with HubSpot integration:", error)
      // Continue without CRM integration
    }

    // Only process LinkedIn profile if no contact was found in HubSpot
    let linkedInInfo = null
    if (!contactInfo && clientLinkedIn) {
      try {
        linkedInInfo = await extractLinkedInInfo(clientLinkedIn, clientEmail)
        
        // Add logging to help debug LinkedIn extraction
        console.log("LinkedIn extraction successful:", {
          url: clientLinkedIn,
          hasData: !!linkedInInfo,
          dataFields: linkedInInfo ? Object.keys(linkedInInfo) : []
        })
      } catch (error) {
        console.error("Error extracting LinkedIn info:", error)
        // Continue without LinkedIn info
      }
    }

    // Fetch the questions' full text first
    const questionDetails = await Promise.all(
      answers.map(async (answer) => {
        const question = await prisma.question.findUnique({
          where: { id: answer.questionId }
        });
        return {
          id: answer.questionId,
          text: question?.text || "Unknown question",
          answer: answer.text
        };
      })
    );

    // Augment answers with context
    const enhancedAnswers = await Promise.all(
      questionDetails.map(async (question) => {
        try {
          const enhancedText = await augmentAnswerWithContext({
            question: question.text,
            answer: question.answer,
            linkedInInfo,
            contactInfo
          });

          return {
            questionId: question.id,
            originalText: question.answer,
            enhancedText
          };
        } catch (error) {
          console.error("Error enhancing answer:", error);
          return {
            questionId: question.id,
            originalText: question.answer,
            enhancedText: question.answer
          };
        }
      })
    );

    // Create calendar event
    let calendarEventId = null
    try {
      const calendarResult = await createCalendarEvent(
        link.userId,
        {
          summary: `${link.name} with ${clientEmail}`,
          description: `Meeting booked via scheduling link: ${link.name}\n\n${enhancedAnswers.map(a => `Q: ${a.questionId}\nA: ${a.originalText}\n${a.enhancedText !== a.originalText ? `Context: ${a.enhancedText}` : ''}`).join('\n\n')}`,
          start: start,
          end: end,
          attendees: [{ email: clientEmail }]
        }
      )
      calendarEventId = calendarResult.id
    } catch (error) {
      console.error("Error creating calendar event:", error)
      // Continue without calendar event
    }

    // Format answers for database
    const formattedAnswers = enhancedAnswers.map(answer => ({
      question: {
        connect: { id: answer.questionId }
      },
      text: answer.originalText,
      augmentedNote: answer.enhancedText !== answer.originalText ? answer.enhancedText : null
    }));

    // Create meeting in database
    const meeting = await prisma.meeting.create({
      data: {
        startTime: start,
        endTime: end,
        clientEmail,
        clientLinkedIn,
        status: "scheduled",
        hubspotContactId: contactInfo?.id,
        linkedInSummary: linkedInInfo ? JSON.stringify(linkedInInfo) : null,
        user: {
          connect: { id: link.userId }
        },
        schedulingLink: {
          connect: { id: link.id }
        },
        answers: {
          create: formattedAnswers
        }
      }
    })

    // Send confirmation emails
    try {
      await sendConfirmationEmail({
        to: clientEmail,
        meetingName: link.name,
        startTime: start,
        duration: link.duration
      });

      const advisor = await prisma.user.findUnique({
        where: { id: link.userId },
        select: { email: true, name: true }
      });

      if (advisor?.email) {
        await sendAdvisorNotification({
          to: advisor.email,
          clientEmail,
          meetingName: link.name,
          startTime: start,
          duration: link.duration,
          answers: enhancedAnswers
        });
      }
    } catch (error) {
      console.error("Error sending email notifications:", error);
      // Continue without email notifications
    }

    // Increment usage count for the link
    await prisma.schedulingLink.update({
      where: { id: link.id },
      data: {
        usageCount: { increment: 1 }
      }
    })

    return NextResponse.json({ 
      success: true, 
      meeting: {
        id: meeting.id,
        startTime: meeting.startTime,
        endTime: meeting.endTime
      }
    }, { status: 200 })
  } catch (error) {
    console.error("Error scheduling meeting:", error)
    return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 })
  }
}
