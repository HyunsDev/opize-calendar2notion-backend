import { google, calendar_v3 } from 'googleapis';

import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDateTime, transDate } from '../../utils/dateUtils';
import { gCalApi } from './api.decorator';
import { GaxiosError } from 'gaxios';
import { SyncError } from '../../error/error';
import { SyncConfig } from '../../types/syncConfig';

export const getGoogleCalendarTokensByUser = (user: UserEntity) => {
    const callbackUrls = JSON.parse(process.env.GOOGLE_CALLBACKS || '{}');

    const callbackUrl = callbackUrls[String(user.googleRedirectUrlVersion)];

    if (!callbackUrl) {
        throw new SyncError({
            code: 'GOOGLE_CALLBACK_URL_NOT_FOUND',
            description: '콜백 URL을 찾을 수 없습니다.',
            finishWork: 'STOP',
            from: 'SYNCBOT',
            level: 'ERROR',
            user: user,
            detail: JSON.stringify({
                callbackUrls,
                googleRedirectUrlVersion: user.googleRedirectUrlVersion,
            }),
        });
    }

    return {
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
        callbackUrl,
    };
};

export class GoogleCalendarAssistApi {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private client: calendar_v3.Calendar;
    private startedAt: Date;
    private config: SyncConfig;

    constructor({
        user,
        calendars,
        startedAt,
        config,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        startedAt: Date;
        config: SyncConfig;
    }) {
        this.user = user;
        this.calendars = calendars;
        this.startedAt = startedAt;
        this.config = config;

        const tokens = getGoogleCalendarTokensByUser(user);

        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_PASSWORD,
            tokens.callbackUrl,
        );
        oAuth2Client.setCredentials({
            refresh_token: tokens.refreshToken,
            access_token: tokens.accessToken,
        });
        this.client = google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
    }

    @gCalApi()
    public async deleteEvent(eventId: string, calendarId: string) {
        try {
            await this.client.events.delete({
                eventId,
                calendarId,
            });
        } catch (err) {
            if (err instanceof GaxiosError) {
                if (err.response?.status === 404) {
                    return;
                }
            }

            throw err;
        }
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
                timeMin: this.config.timeMin,
                timeMax: this.config.timeMax,
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
                timeMin: this.config.timeMin,
                timeMax: this.config.timeMax,
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

        try {
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
        } catch (err: unknown) {
            if (
                err instanceof GaxiosError &&
                err.response.status === 403 &&
                err.response.data.error.message === 'Forbidden' &&
                err.response.data.error.errors[0].domain === 'global' &&
                err.response.data.error.errors[0].reason === 'forbidden'
            ) {
                return false;
            } else {
                throw err;
            }
        }
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
