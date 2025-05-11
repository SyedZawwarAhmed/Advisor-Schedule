import { google, Auth, calendar_v3 } from 'googleapis';
import { prisma } from '@/prisma';

// Setup OAuth2 client for Google APIs
export const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google-calendar`
  );
};

// Create Google Calendar API client with the given credentials
export const getCalendarClient = (credentials: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Get calendar list for the authenticated user
export const getCalendarList = async (auth: Auth.OAuth2Client) => {
  const calendar = google.calendar({ version: 'v3', auth });
  const response = await calendar.calendarList.list();
  return response.data.items || [];
};

// Fetch events for a specific calendar
export const getCalendarEvents = async (
  calendarId: string,
  credentials: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
  },
  timeMin: Date,
  timeMax: Date
) => {
  const calendar = getCalendarClient(credentials);
  
  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return response.data.items || [];
};

// Sync user's calendar events to our database
export const syncCalendarEvents = async (calendarAccountId: string) => {
  const calendarAccount = await prisma.calendarAccount.findUnique({
    where: { id: calendarAccountId },
  });

  if (!calendarAccount) {
    throw new Error('Calendar account not found');
  }

  // Time range for syncing (from now to 90 days in the future)
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + 90);

  const credentials = {
    access_token: calendarAccount.accessToken,
    refresh_token: calendarAccount.refreshToken,
    expiry_date: calendarAccount.expiresAt.getTime(),
  };

  const events = await getCalendarEvents(
    calendarAccount.calendarId,
    credentials,
    now,
    futureDate
  );

  // Delete existing events to avoid duplicates
  await prisma.calendarEvent.deleteMany({
    where: { calendarAccountId },
  });

  // Create batch of events to insert
  const eventsToCreate = events.map(event => ({
    calendarAccountId,
    eventId: event.id!,
    title: event.summary || 'Untitled Event',
    description: event.description || null,
    startTime: new Date(event.start?.dateTime || event.start?.date!),
    endTime: new Date(event.end?.dateTime || event.end?.date!),
  }));

  if (eventsToCreate.length > 0) {
    await prisma.calendarEvent.createMany({
      data: eventsToCreate,
    });
  }

  return eventsToCreate.length;
};

// Create a calendar event
export const createCalendarEvent = async (
  calendarAccountId: string,
  eventDetails: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees: { email: string }[];
  }
) => {
  const calendarAccount = await prisma.calendarAccount.findUnique({
    where: { id: calendarAccountId },
  });

  if (!calendarAccount) {
    throw new Error('Calendar account not found');
  }

  const credentials = {
    access_token: calendarAccount.accessToken,
    refresh_token: calendarAccount.refreshToken,
    expiry_date: calendarAccount.expiresAt.getTime(),
  };

  const calendar = getCalendarClient(credentials);
  
  const event: calendar_v3.Schema$Event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: eventDetails.end.toISOString(),
      timeZone: 'UTC',
    },
    attendees: eventDetails.attendees,
    reminders: {
      useDefault: true,
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarAccount.calendarId,
    requestBody: event,
    sendUpdates: 'all',
  });

  return response.data;
};

// Check if a time slot is available (not overlapping with any existing events)
export const isTimeSlotAvailable = async (
  userId: string,
  startTime: Date,
  endTime: Date
) => {
  // Get all calendar accounts for this user
  const calendarAccounts = await prisma.calendarAccount.findMany({
    where: { userId },
  });

  // Check for overlapping events in all connected calendars
  const overlappingEvents = await prisma.calendarEvent.findMany({
    where: {
      calendarAccountId: {
        in: calendarAccounts.map(account => account.id),
      },
      OR: [
        // Event starts during our proposed meeting
        {
          startTime: {
            gte: startTime,
            lt: endTime,
          },
        },
        // Event ends during our proposed meeting
        {
          endTime: {
            gt: startTime,
            lte: endTime,
          },
        },
        // Event completely encapsulates our proposed meeting
        {
          startTime: {
            lte: startTime,
          },
          endTime: {
            gte: endTime,
          },
        },
      ],
    },
  });

  return overlappingEvents.length === 0;
}; 