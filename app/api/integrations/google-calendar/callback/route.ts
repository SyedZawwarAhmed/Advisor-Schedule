import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOAuth2Client } from '@/lib/google-calendar';
import { google } from 'googleapis';
import { prisma } from '@/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendars?error=No authorization code received`
      );
    }
    
    const oauth2Client = getOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user's calendar list
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarResponse = await calendar.calendarList.list();
    const primaryCalendar = calendarResponse.data.items?.find(
      (cal) => cal.primary
    );
    
    if (!primaryCalendar) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendars?error=Primary calendar not found`
      );
    }
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const userEmail = userInfoResponse.data.email;
    const userName = userInfoResponse.data.name;
    
    // Save calendar account to database
    await prisma.calendarAccount.create({
      data: {
        userId: session.user.id,
        provider: 'google',
        name: userName || 'Google Calendar',
        email: userEmail || '',
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
        calendarId: primaryCalendar.id || '',
      },
    });
    
    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendars?success=true`
    );
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendars?error=Failed to connect Google Calendar`
    );
  }
} 