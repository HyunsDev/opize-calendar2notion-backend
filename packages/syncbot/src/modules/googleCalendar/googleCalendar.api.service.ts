import { CalendarEntity, UserEntity } from '@opize/calendar2notion-object';
import { google, calendar_v3 } from 'googleapis';

import { SyncContext } from '@/contexts/sync.context';
import { GoogleCalendarEventDto } from '@/dto/GoogleCalendarEvent';
import { Injectable } from '@/libs/dependency';

import { fetchAll } from '../notion/utils/fetchAll';

import { GoogleCalendarAPI } from './api.decorator';

export const getGoogleCalendarTokensByUser = (user: UserEntity) => {
    const callbackUrls = JSON.parse(process.env.GOOGLE_CALLBACKS || '{}');
    const callbackUrl = callbackUrls[String(user.googleRedirectUrlVersion)];

    return {
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
        callbackUrl,
    };
};

@Injectable()
export class GoogleCalendarAPIService {
    private client: calendar_v3.Calendar;
    context: SyncContext;

    constructor(syncContext: SyncContext) {
        this.context = syncContext;
        this.client = this.getClient();
    }

    @GoogleCalendarAPI()
    async getEventsByCalendar(
        calendar: CalendarEntity,
    ): Promise<GoogleCalendarEventDto[]> {
        const res = await fetchAll(async (nextPageToken) => {
            const res = await this.client.events.list({
                calendarId: calendar.googleCalendarId,
                maxResults: 2500,
                timeZone: this.context.user.userTimeZone,
                pageToken: nextPageToken,
                singleEvents: true,
                timeMin: this.context.config.timeMin,
                timeMax: this.context.config.timeMax,
            });
            return {
                results: res.data.items || [],
                nextCursor: res.data.nextPageToken,
            };
        });
        return res.map((event) =>
            GoogleCalendarEventDto.fromGoogleCalendar(event, calendar),
        );
    }

    @GoogleCalendarAPI()
    async getUpdatedEventsByCalendar(
        calendar: CalendarEntity,
    ): Promise<GoogleCalendarEventDto[]> {
        const res = await fetchAll(async (nextPageToken) => {
            const res = await this.client.events.list({
                calendarId: calendar.googleCalendarId,
                maxResults: 2500,
                timeZone: this.context.user.userTimeZone,
                pageToken: nextPageToken,
                showDeleted: true,
                singleEvents: true,
                timeMin: this.context.config.timeMin,
                timeMax: this.context.config.timeMax,
                updatedMin: new Date(
                    this.context.user.lastCalendarSync,
                ).toISOString(),
            });
            return {
                results: res.data.items || [],
                nextCursor: res.data.nextPageToken,
            };
        });
        return res.map((event) =>
            GoogleCalendarEventDto.fromGoogleCalendar(event, calendar),
        );
    }

    @GoogleCalendarAPI()
    async getEvent(
        eventId: string,
        calendar: CalendarEntity,
    ): Promise<GoogleCalendarEventDto> {
        const res = await this.client.events.get({
            calendarId: calendar.googleCalendarId,
            eventId,
        });
        return GoogleCalendarEventDto.fromGoogleCalendar(res.data, calendar);
    }

    @GoogleCalendarAPI()
    async createEvent(
        event: GoogleCalendarEventDto,
    ): Promise<GoogleCalendarEventDto> {
        const res = await this.client.events.insert({
            calendarId: event.calendar.googleCalendarId,
            requestBody: {
                start: event.date.start,
                end: event.date.end,
                summary: event.summary,
                description: event.description,
                location: event.location,
                status: event.status,
                // Cron과의 연결을 위한 extendedProperties
                extendedProperties: {
                    shared: {
                        [`n.attchwsid.${event.notionEventId}`]:
                            'bdcd90fd-4c12-4832-9caf-4fb21fc6c524',
                        [`n.attchwsid.878025b813f54f1996ac4e985d3cd422`]:
                            'bdcd90fd-4c12-4832-9caf-4fb21fc6c524',
                    },
                },
                // Google Calendar에 Notion Event를 첨부하기 위한 attachments
                attachments: [
                    {
                        fileUrl: `https://www.notion.so/${event.notionEventId}`,
                        title: event.summary,
                        iconLink:
                            'https://lh3.googleusercontent.com/pw/AJFCJaU8wzEWMXWYp2glnlt4vX9rdN3h4KJGpgu6zshkAEPSohFfttbcfQh_TJf1LqOwuoWvBQaVZaShLmbFfIUaZlu-kAkaeLkQSKTrMHUoIDviYIbizCzOIOwp-g2Wl6amU0LuYxkqO9kLcOe-L4o_qEg=w32-h32-s-no?authuser=0',
                    },
                ],
            },
        });
        return GoogleCalendarEventDto.fromGoogleCalendar(
            res.data,
            event.calendar,
        );
    }

    @GoogleCalendarAPI()
    async updateEvent(
        event: GoogleCalendarEventDto,
    ): Promise<GoogleCalendarEventDto> {
        const existEvent = await this.getEvent(
            event.googleCalendarEventId,
            event.calendar,
        );

        const extendedProperties = {
            shared: {
                ...existEvent.originalGoogleCalendarEvent.extendedProperties
                    ?.shared,
                [`n.attchwsid.${event.notionEventId}`]:
                    'bdcd90fd-4c12-4832-9caf-4fb21fc6c524',
                [`n.attchwsid.878025b813f54f1996ac4e985d3cd422`]:
                    'bdcd90fd-4c12-4832-9caf-4fb21fc6c524',
            },
            private: {
                ...existEvent.originalGoogleCalendarEvent.extendedProperties
                    ?.private,
            },
        };

        const attachmentsWithoutNotion =
            existEvent.originalGoogleCalendarEvent.attachments?.filter(
                (attachment) =>
                    attachment.fileUrl !==
                    `https://www.notion.so/${event.notionEventId}`,
            );

        const notionAttachment =
            existEvent.originalGoogleCalendarEvent.attachments?.find(
                (attachment) =>
                    attachment.fileUrl ===
                    `https://www.notion.so/${event.notionEventId}`,
            ) || {
                fileUrl: `https://www.notion.so/${event.notionEventId}`,
                title: event.summary,
                iconLink:
                    'https://lh3.googleusercontent.com/pw/AJFCJaU8wzEWMXWYp2glnlt4vX9rdN3h4KJGpgu6zshkAEPSohFfttbcfQh_TJf1LqOwuoWvBQaVZaShLmbFfIUaZlu-kAkaeLkQSKTrMHUoIDviYIbizCzOIOwp-g2Wl6amU0LuYxkqO9kLcOe-L4o_qEg=w32-h32-s-no?authuser=0',
            };
        notionAttachment.title = event.summary;

        const res = await this.client.events.update({
            calendarId: event.calendar.googleCalendarId,
            eventId: event.googleCalendarEventId,
            requestBody: {
                start: event.date.start,
                end: event.date.end,
                summary: event.summary,
                description: event.description,
                location: event.location,
                status: event.status,
                extendedProperties,
                attachments: [...attachmentsWithoutNotion, notionAttachment],
            },
        });

        return GoogleCalendarEventDto.fromGoogleCalendar(
            res.data,
            event.calendar,
        );
    }

    @GoogleCalendarAPI()
    async moveEventCalendar(
        event: GoogleCalendarEventDto,
        newCalendar: CalendarEntity,
    ) {
        const res = await this.client.events.move({
            eventId: event.googleCalendarEventId,
            calendarId: event.calendar.googleCalendarId,
            destination: newCalendar.googleCalendarId,
        });
        return GoogleCalendarEventDto.fromGoogleCalendar(res.data, newCalendar);
    }

    @GoogleCalendarAPI()
    async deleteEvent(event: GoogleCalendarEventDto) {
        await this.client.events.delete({
            calendarId: event.calendar.googleCalendarId,
            eventId: event.googleCalendarEventId,
        });
    }

    private getClient() {
        const tokens = getGoogleCalendarTokensByUser(this.context.user);
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_PASSWORD,
            tokens.callbackUrl,
        );
        oAuth2Client.setCredentials({
            refresh_token: tokens.refreshToken,
            access_token: tokens.accessToken,
        });
        return google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
    }
}
