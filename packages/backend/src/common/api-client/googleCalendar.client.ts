import { google, calendar_v3 } from 'googleapis';

export class GoogleCalendarClient {
    private client: calendar_v3.Calendar;

    constructor(accessToken: string, refreshToken: string) {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_PASSWORD,
            process.env.GOOGLE_CALLBACK,
        );
        oAuth2Client.setCredentials({
            refresh_token: refreshToken,
            access_token: accessToken,
        });
        this.client = google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
    }

    async getEvent(calendarId: string, eventId: string) {
        return await this.client.events.get({
            calendarId,
            eventId,
        });
    }

    async getCalendars() {
        return await this.client.calendarList.list();
    }

    async getCalendar(calendarId: string) {
        return await this.client.calendars.get({
            calendarId,
        });
    }
}
