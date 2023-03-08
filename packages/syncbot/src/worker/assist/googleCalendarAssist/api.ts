
import { google, calendar_v3 } from 'googleapis';

import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDateTime, transDate } from '../../utils/dateUtils';
import { gCalApi } from './api.decorator';

]
export class GoogleCalendarAssistApi {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private client: calendar_v3.Calendar;
    private startedAt: Date;

    constructor({
        user,
        calendars,
        startedAt,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        startedAt: Date;
    }) {
        this.user = user;
        this.calendars = calendars;
        this.startedAt = startedAt;

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_PASSWORD,
            process.env.GOOGLE_CALLBACK,
        );
        oAuth2Client.setCredentials({
            refresh_token: this.user.googleRefreshToken,
            access_token: this.user.googleAccessToken,
        });
        this.client = google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
    }

    @gCalApi()
    public async deleteEvent(eventId: string, calendarId: string) {
        await this.client.events.delete({
            eventId,
            calendarId,
        });
    }

    @gCalApi()
    public async getEventByCalendar(calendarId: string) {
        let nextPageToken: string = undefined;
        const events: calendar_v3.Schema$Event[] = [];

        while (true) {
            const res = await this.client.events.list({
                calendarId: calendarId,
                maxResults: 2500,
                timeZone: this.user.userTimeZone,
                pageToken: nextPageToken,
                singleEvents: true,
                timeMin: '2010-01-01T01:00:00+09:00',
                timeMax: '2030-01-01T01:00:00+09:00',
            });

            events.push(...res.data.items);
            nextPageToken = res.data.nextPageToken;
            if (!res.data.nextPageToken) break;
        }

        return events;
    }

    @gCalApi()
    public async getUpdatedEventsByCalendar(calendar: CalendarEntity) {
        let nextPageToken: string = undefined;
        const events: calendar_v3.Schema$Event[] = [];

        while (true) {
            const res = await this.client.events.list({
                calendarId: calendar.googleCalendarId,
                maxResults: 2500,
                timeZone: this.user.userTimeZone,
                pageToken: nextPageToken,
                showDeleted: true,
                singleEvents: true,
                updatedMin: new Date(this.user.lastCalendarSync).toISOString(),
                timeMin: '2010-01-01T01:00:00+09:00',
                timeMax: '2030-01-01T01:00:00+09:00',
            });

            events.push(...res.data.items);
            nextPageToken = res.data.nextPageToken;
            if (!res.data.nextPageToken) break;
        }

        return events;
    }

    @gCalApi()
    public async moveCalendar(
        eventId: string,
        calendarId: string,
        newCalendar: CalendarEntity,
    ) {
        return await this.client.events.move({
            eventId: eventId,
            calendarId: calendarId,
            destination: newCalendar.googleCalendarId,
        });
    }

    @gCalApi()
    public async updateEvent(eventLink: EventEntity, page: PageObjectResponse) {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);

        const titleProp = Object.values(page.properties).find(
            (e) => e.type === 'title',
        ) as any;
        const title =
            titleProp.title.map((e: any) => e?.plain_text).join('') || '';

        const dateProp = Object.values(page.properties).find(
            (e) => e.id === props.date,
        ) as {
            date: NotionDateTime;
        };
        const date = transDate.eventToGcal(
            transDate.notionToEvent({
                start: dateProp.date.start,
                end: dateProp.date.end,
            }),
        );

        const descriptionProp = Object.values(page.properties).find(
            (e) => e.id === props.description,
        ) as any;
        const description: string =
            descriptionProp.rich_text.map((e: any) => e?.plain_text).join() ||
            undefined;

        const locationProp = Object.values(page.properties).find(
            (e) => e.id === props.location,
        ) as any;
        const location: string =
            locationProp.rich_text.map((e: any) => e?.plain_text).join() ||
            undefined;

        return await this.client.events.patch({
            eventId: eventLink.googleCalendarEventId,
            calendarId: eventLink.googleCalendarCalendarId,
            requestBody: {
                start: date.start,
                end: date.end,
                summary: title,
                [description && 'description']: description,
                [location && 'location']: location,
            },
        });
    }

    @gCalApi()
    public async createEvent(
        calendar: CalendarEntity,
        page: PageObjectResponse,
    ) {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);

        const titleProp = Object.values(page.properties).find(
            (e) => e.type === 'title',
        ) as any;
        const title =
            titleProp.title.map((e: any) => e.plain_text).join('') || '';

        const dateProp = Object.values(page.properties).find(
            (e) => e.id === props.date,
        ) as {
            date: NotionDateTime;
        };
        const date = transDate.eventToGcal(
            transDate.notionToEvent({
                start: dateProp.date.start,
                end: dateProp.date.end,
            }),
        );

        const descriptionProp = Object.values(page.properties).find(
            (e) => e.id === props.description,
        ) as any;
        const description: string =
            descriptionProp.rich_text.map((e: any) => e?.plain_text).join('') ||
            undefined;

        const locationProp = Object.values(page.properties).find(
            (e) => e.id === props.location,
        ) as any;
        const location: string =
            locationProp.rich_text.map((e: any) => e?.plain_text).join('') ||
            undefined;

        const res = await this.client.events.insert({
            calendarId: calendar.googleCalendarId,
            requestBody: {
                start: date.start,
                end: date.end,
                summary: title,
                [description && 'description']: description,
                [location && 'location']: location,
            },
        });
        return res.data;
    }
}
