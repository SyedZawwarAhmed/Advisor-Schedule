import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { prisma } from '@/prisma';

// Create a transporter for Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send confirmation email to client
export const sendConfirmationEmail = async ({
  to,
  meetingName,
  startTime,
  duration,
}: {
  to: string;
  meetingName: string;
  startTime: Date;
  duration: number;
}) => {
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedStartTime = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedEndTime = endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const subject = `Confirmation: ${meetingName} - ${formattedDate}`;
  
  const text = `
    Your meeting has been confirmed!
    
    Meeting: ${meetingName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    
    If you need to reschedule or cancel, please contact us directly.
    
    Thank you!
  `;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your meeting has been confirmed!</h2>
      
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <p><strong>Meeting:</strong> ${meetingName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
      </div>
      
      <p>If you need to reschedule or cancel, please contact us directly.</p>
      
      <p>Thank you!</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};

// Send notification to advisor
export const sendAdvisorNotification = async ({
  to,
  clientEmail,
  meetingName,
  startTime,
  duration,
  answers = [],
}: {
  to: string;
  clientEmail: string;
  meetingName: string;
  startTime: Date;
  duration: number;
  answers?: Array<{
    questionId: string;
    originalText: string;
    enhancedText: string;
  }>;
}) => {
  const endTime = new Date(startTime.getTime() + duration * 60000);
  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedStartTime = startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedEndTime = endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  const subject = `New Booking: ${meetingName} with ${clientEmail}`;
  
  // Create text for answers and context
  const answersText = answers.map(answer => {
    let text = `Q: ${answer.questionId}\nA: ${answer.originalText}`;
    
    // Add enhanced context if available
    if (answer.enhancedText && answer.enhancedText !== answer.originalText) {
      text += `\n\nContext: ${answer.enhancedText.replace('Context: ', '')}`;
    }
    
    return text;
  }).join('\n\n');
  
  const text = `
    New meeting booked!
    
    Client: ${clientEmail}
    Meeting: ${meetingName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    
    Client Responses:
    ${answersText}
  `;
  
  // Create HTML for answers and context
  const answersHtml = answers.map(answer => {
    let html = `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
        <p style="font-weight: bold; margin-bottom: 5px;">Q: ${answer.questionId}</p>
        <p style="margin-bottom: 15px;">${answer.originalText}</p>
    `;
    
    // Add enhanced context if available
    if (answer.enhancedText && answer.enhancedText !== answer.originalText) {
      const contextText = answer.enhancedText.replace('Context: ', '');
      html += `
        <div style="margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #007bff;">
          <p style="margin: 0; font-style: italic; color: #555;"><strong>Context:</strong> ${contextText}</p>
        </div>
      `;
    }
    
    html += `</div>`;
    return html;
  }).join('');
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New meeting booked!</h2>
      
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <p><strong>Client:</strong> ${clientEmail}</p>
        <p><strong>Meeting:</strong> ${meetingName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
      </div>
      
      <h3>Client Responses:</h3>
      ${answersHtml}
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}; 