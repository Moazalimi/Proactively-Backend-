import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const createCalendarEvent = async (userEmail, speakerEmail, bookingDetails) => {
  const event = {
    summary: 'Speaker Session',
    description: 'Booked speaker session',
    start: {
      dateTime: `${bookingDetails.date}T${bookingDetails.time}:00`,
      timeZone: 'UTC',
    },
    end: {
      dateTime: `${bookingDetails.date}T${parseInt(bookingDetails.time) + 1}:00:00`,
      timeZone: 'UTC',
    },
    attendees: [
      { email: userEmail },
      { email: speakerEmail }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}; 