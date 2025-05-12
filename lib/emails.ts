import nodemailer from 'nodemailer';
import { prisma } from '@/prisma';

interface AnswerWithQuestion {
  question: string;
  text: string;
}

interface EmailNotificationParams {
  advisorEmail: string;
  clientEmail: string;
  clientLinkedIn?: string;
  meetingTime: Date | string;
  meetingName: string;
  duration: number;
  answers: AnswerWithQuestion[];
  augmentedAnswers: string[];
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send notification email when a meeting is scheduled
export async function sendMeetingNotificationEmail({
  advisorEmail,
  clientEmail,
  clientLinkedIn,
  meetingTime,
  meetingName,
  duration,
  answers,
  augmentedAnswers,
}: EmailNotificationParams) {
  try {
    // Format the date and time
    const formattedDate = new Date(meetingTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const formattedTime = new Date(meetingTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Build the email content
    let emailContent = `
      <h2>New Meeting Scheduled</h2>
      <p>A new meeting has been scheduled with ${clientEmail}.</p>
      
      <h3>Meeting Details</h3>
      <ul>
        <li><strong>Type:</strong> ${meetingName}</li>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Time:</strong> ${formattedTime}</li>
        <li><strong>Duration:</strong> ${duration} minutes</li>
      </ul>
    `;

    if (clientLinkedIn) {
      emailContent += `<p><strong>LinkedIn:</strong> <a href="${clientLinkedIn}">${clientLinkedIn}</a></p>`;
    }

    // Add client responses with AI-enhanced context
    emailContent += `<h3>Client Responses</h3>`;

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const augmentedAnswer = augmentedAnswers[i];
      
      emailContent += `
        <div style="margin-bottom: 20px; padding: 15px; border-left: 4px solid #007bff; background-color: #f8f9fa;">
          <p><strong>Question:</strong> ${answer.question}</p>
          <p><strong>Answer:</strong> ${answer.text}</p>
          
          ${augmentedAnswer && augmentedAnswer !== answer.text ? 
            `<div style="margin-top: 10px; padding: 10px; background-color: #e9f7ef; border-left: 4px solid #28a745;">
              <p><strong>Context:</strong> ${augmentedAnswer.replace(/^Context:/i, '')}</p>
            </div>` : ''}
        </div>
      `;
    }

    // Send the email
    await transporter.sendMail({
      from: `"Advisor Schedule" <${process.env.EMAIL_USER}>`,
      to: advisorEmail,
      subject: `New Meeting: ${meetingName} with ${clientEmail}`,
      html: emailContent,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending meeting notification email:', error);
    return { success: false, error };
  }
} 