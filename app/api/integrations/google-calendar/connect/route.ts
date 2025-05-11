import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { google } from 'googleapis';
import { prisma } from '@/prisma';
import { getOAuth2Client } from '@/lib/google-calendar';

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const oauth2Client = getOAuth2Client();
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      prompt: 'consent',
    });
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'Primary calendar not found' },
        { status: 404 }
      );
    }
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const userEmail = userInfoResponse.data.email;
    const userName = userInfoResponse.data.name;
    
    // Save calendar account to database
    const calendarAccount = await prisma.calendarAccount.create({
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
    
    return NextResponse.json({
      success: true,
      calendarAccount: {
        id: calendarAccount.id,
        name: calendarAccount.name,
        email: calendarAccount.email,
      },
    });
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to connect Google Calendar' },
      { status: 500 }
    );
  }
} 