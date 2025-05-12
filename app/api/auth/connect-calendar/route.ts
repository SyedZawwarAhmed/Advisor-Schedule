import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { google, Auth, calendar_v3 } from 'googleapis';

export async function POST() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user already has a Google Calendar account
    const existingCalendarAccount = await prisma.calendarAccount.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
        email: session.user.email,
      },
    });

    if (!existingCalendarAccount) {
      // Get the user's Google account
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'google',
        },
      });

      if (!account?.access_token) {
        return NextResponse.json(
          { error: 'No Google account found' },
          { status: 404 }
        );
      }

      // Set up OAuth2 client
      const oauth2Client = new Auth.OAuth2Client(
        process.env.AUTH_GOOGLE_ID,
        process.env.AUTH_GOOGLE_SECRET,
        `${process.env.NEXTAUTH_URL}/api/auth/callback/google-calendar`
      );

      // Set credentials from the account
      oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      });

      // Get user's calendar list
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const calendarResponse = await calendar.calendarList.list();
      const primaryCalendar = calendarResponse.data.items?.find(
        (cal: calendar_v3.Schema$CalendarListEntry) => cal.primary
      );

      if (primaryCalendar?.id) {
        // Save calendar account to database
        await prisma.calendarAccount.create({
          data: {
            userId: session.user.id,
            provider: 'google',
            name: session.user.name || 'Google Calendar',
            email: session.user.email,
            accessToken: account.access_token,
            refreshToken: account.refresh_token || '',
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : new Date(),
            calendarId: primaryCalendar.id,
          },
        });

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to connect calendar' },
      { status: 500 }
    );
  }
} 