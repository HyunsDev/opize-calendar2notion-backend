import { Client } from '@notionhq/client';
import { calendar_v3 } from 'googleapis';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import { transDate } from '../../../worker/utils/dateUtils';
import { notionApi } from './api.decorator';

export class NotionAssistApi {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private client: Client;
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

        this.client = new Client({
            auth: this.user.notionAccessToken,
        });
    }

    @notionApi('database')
    async getDatabase() {
        return await this.client.databases.retrieve({
            database_id: this.user.notionDatabaseId,
        });
    }

    @notionApi('database')
    async getDeletedPageIds() {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);
        const calendarNames = this.calendars.map((e) => e.googleCalendarName);
        const calendarOptions = this.calendars
            .filter((e) => e.accessRole !== 'reader')
            .map((e) => ({
                property: props.calendar,
                select: {
                    does_not_equal: `${calendarNames[e.googleCalendarId]}`,
                },
            }));

        const pageIds: string[] = [];
        let nextCursor: string = undefined;
        while (true) {
            const res = await this.client.databases.query({
                database_id: this.user.notionDatabaseId,
                start_cursor: nextCursor,
                filter: {
                    and: [
                        {
                            property: props.delete,
                            checkbox: {
                                equals: true,
                            },
                        },
                        {
                            property: props.calendar,
                            select: {
                                is_not_empty: true,
                            },
                        },
                        {
                            property: props.date,
                            date: {
                                on_or_after: process.env.MIN_DATE,
                                on_or_before: process.env.MAX_DATE,
                            },
                        },
                        {
                            or: calendarOptions,
                        },
                    ],
                },
            });

            pageIds.push(...res.results.map((e) => e.id));
            nextCursor = res.next_cursor;
            if (!nextCursor) break;
        }

        return pageIds;
    }

    @notionApi('page')
    async getProp(pageId: string, propertyId: string) {
        return await this.client.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId,
        });
    }

    @notionApi('page')
    async deletePage(pageId: string) {
        return await this.client.pages.update({
            page_id: pageId,
            archived: true,
        });
    }

    @notionApi('database')
    async updateCalendarProps(
        calendars: {
            name: string;
            id?: string;
        }[],
    ) {
        const calendarProp: string = JSON.parse(this.user.notionProps).calendar;
        return await this.client.databases.update({
            database_id: this.user.notionDatabaseId,
            properties: {
                [calendarProp]: {
                    select: {
                        options: calendars,
                    },
                },
            },
        });
    }

    @notionApi('page')
    async createPage(
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
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

        return await this.client.pages.create({
            parent: {
                type: 'database_id',
                database_id: this.user.notionDatabaseId,
            },
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: event.summary || '',
                            },
                        },
                    ],
                },
                [props.calendar]: {
                    type: 'select',
                    select: {
                        id: calendar.notionPropertyId,
                    },
                },
                [props.date]: {
                    type: 'date',
                    date: transDate.eventToNotion(
                        transDate.gCalToEvent({
                            start: event.start,
                            end: event.end,
                        }),
                    ),
                },
                [props.description]: props.description && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: event.description || '',
                            },
                        },
                    ],
                },
                [props.location]: props.location && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: event.location || '',
                            },
                        },
                    ],
                },
            },
        });
    }

    @notionApi('page')
    public async getUpdatedPages() {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);
        const calendarNames = this.calendars.map((e) => e.googleCalendarName);
        const calendarOptions = this.calendars
            .filter((e) => e.accessRole !== 'reader')
            .map((e) => ({
                property: props.calendar,
                select: {
                    does_not_equal: `${calendarNames[e.googleCalendarId]}`,
                },
            }));

        const pages: PageObjectResponse[] = [];
        let nextCursor: string = undefined;

        while (true) {
            const res = await this.client.databases.query({
                database_id: this.user.notionDatabaseId,
                start_cursor: nextCursor,
                filter: {
                    and: [
                        {
                            property: props.delete,
                            checkbox: {
                                equals: false,
                            },
                        },
                        {
                            property: props.calendar,
                            select: {
                                is_not_empty: true,
                            },
                        },
                        {
                            property: props.date,
                            date: {
                                on_or_after: process.env.MIN_DATE,
                                on_or_before: process.env.MAX_DATE,
                            },
                        },
                        {
                            or: calendarOptions,
                        },
                        {
                            timestamp: 'last_edited_time',
                            last_edited_time: {
                                on_or_after: new Date(
                                    this.user.lastCalendarSync,
                                ).toISOString(),
                            },
                        },
                    ],
                },
            });

            pages.push(...(res.results as PageObjectResponse[]));
            nextCursor = res.next_cursor;
            if (!nextCursor) break;
        }

        return pages;
    }

    @notionApi('page')
    public async updatePage(
        eventLink: EventEntity,
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
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
        return await this.client.pages.update({
            page_id: eventLink.notionPageId,
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: event.summary || '',
                            },
                        },
                    ],
                },
                [props.date]: {
                    date: transDate.eventToNotion(
                        transDate.gCalToEvent({
                            start: event.start,
                            end: event.end,
                        }),
                    ),
                },
                [props.calendar]: {
                    select: {
                        id: calendar.notionPropertyId,
                    },
                },
                [props.description]: props.description && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: event.description || '',
                            },
                        },
                    ],
                },
                [props.location]: props.location && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: event.location || '',
                            },
                        },
                    ],
                },
            },
        });
    }
}
