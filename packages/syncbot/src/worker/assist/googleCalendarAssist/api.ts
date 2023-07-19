import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { GaxiosError } from 'gaxios';
import { google, calendar_v3 } from 'googleapis';
import { WorkerContext } from 'src/worker/context/workerContext';

import { SyncError } from '../../error/error';
import { SyncConfig } from '../../types/syncConfig';
import { NotionDateTime, transDate } from '../../utils/dateUtils';

import { gCalApi } from './api.decorator';

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
    private context: WorkerContext;

    private client: calendar_v3.Calendar;

    constructor({ context }: { context: WorkerContext }) {
        this.context = context;

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

                if (err.response.status == 410) {
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
                timeZone: this.context.user.userTimeZone,
                pageToken: nextPageToken,
                singleEvents: true,
                timeMin: this.context.config.timeMin,
                timeMax: this.context.config.timeMax,
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
                timeZone: this.context.user.userTimeZone,
                pageToken: nextPageToken,
                showDeleted: true,
                singleEvents: true,
                updatedMin: new Date(
                    this.context.user.lastCalendarSync,
                ).toISOString(),
                timeMin: this.context.config.timeMin,
                timeMax: this.context.config.timeMax,
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
        } = JSON.parse(this.context.user.notionProps);

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

        try {
            return await this.client.events.patch({
                eventId: eventLink.googleCalendarEventId,
                calendarId: eventLink.googleCalendarCalendarId,
                requestBody: {
                    start: date.start,
                    end: date.end,
                    summary: title,
                },
            });
        } catch (err: unknown) {
            if (err instanceof GaxiosError) {
                if (
                    err.response.status === 403 &&
                    err.response.data.error.message === 'Forbidden' &&
                    err.response.data.error.errors[0].domain === 'global' &&
                    err.response.data.error.errors[0].reason === 'forbidden'
                ) {
                    return;
                }

                // TODO: #94 노션에서 수정된 일정이 구글 캘린더에 없을 경우의 처리 수정
                if (err.response.status === 404) {
                    return;
                }
            }

            throw err;
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
        } = JSON.parse(this.context.user.notionProps);

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

        const res = await this.client.events.insert({
            calendarId: calendar.googleCalendarId,
            requestBody: {
                start: date.start,
                end: date.end,
                summary: title,
            },
        });
        return res.data;
    }
}
