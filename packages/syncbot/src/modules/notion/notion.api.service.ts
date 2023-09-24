import { Client } from '@notionhq/client';

import { SyncContext } from '@/contexts/sync.context';
import { NotionEventDto } from '@/dto/NotionEvent';

import { fetchAll } from './utils/fetchAll';

export class NotionAPIService {
    private client: Client;
    context: SyncContext;

    constructor(syncContext: SyncContext) {
        this.context = syncContext;
        this.client = new Client({
            auth: this.context.user.notionWorkspace.accessToken,
        });
    }

    async getDatabase() {
        return await this.client.databases.retrieve({
            database_id: this.context.user.notionDatabaseId,
        });
    }

    async getPageProp(pageId: string, propertyId: string) {
        return await this.client.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId,
        });
    }

    async getPages() {
        const props = this.context.user.parsedNotionProps;
        const writeAbleCalendarOptions = this.context.calendars
            .filter((c) => c.status === 'CONNECTED')
            .filter((c) => c.accessRole !== 'reader')
            .map((c) => ({
                property: props.calendar,
                select: {
                    equals: c.googleCalendarName,
                },
            }));

        const result = await fetchAll(async (nextCursor) => {
            const res = await this.client.databases.query({
                database_id: this.context.user.notionDatabaseId,
                start_cursor: nextCursor,
                filter: {
                    and: [
                        {
                            property: props.calendar,
                            select: {
                                is_not_empty: true,
                            },
                        },
                        {
                            property: props.date,
                            date: {
                                on_or_after: this.context.config.timeMin,
                                on_or_before: this.context.config.timeMax,
                            },
                        },
                        {
                            or: writeAbleCalendarOptions,
                        },
                    ],
                },
            });
            return {
                results: res.results,
                nextCursor: res.next_cursor,
            };
        });

        return result;
    }

    async getUpdatedPages() {
        const props = this.context.user.parsedNotionProps;
        const writeAbleCalendarOptions = this.context.calendars
            .filter((c) => c.status === 'CONNECTED')
            .filter((c) => c.accessRole !== 'reader')
            .map((c) => ({
                property: props.calendar,
                select: {
                    equals: c.googleCalendarName,
                },
            }));

        const result = await fetchAll(async (nextCursor) => {
            const res = await this.client.databases.query({
                database_id: this.context.user.notionDatabaseId,
                start_cursor: nextCursor,
                filter: {
                    and: [
                        {
                            property: props.calendar,
                            select: {
                                is_not_empty: true,
                            },
                        },
                        {
                            property: props.date,
                            date: {
                                on_or_after: this.context.config.timeMin,
                                on_or_before: this.context.config.timeMax,
                            },
                        },
                        {
                            or: writeAbleCalendarOptions,
                        },
                        {
                            property: props.last_edited_by,
                            people: {
                                contains:
                                    this.context.user.notionWorkspace.botId,
                            },
                        },
                    ],
                },
            });
            return {
                results: res.results,
                nextCursor: res.next_cursor,
            };
        });

        return result;
    }

    async getDeletedPages() {
        const props = this.context.user.parsedNotionProps;
        const writeAbleCalendarOptions = this.context.calendars
            .filter((c) => c.status === 'CONNECTED')
            .filter((c) => c.accessRole !== 'reader')
            .map((c) => ({
                property: props.calendar,
                select: {
                    equals: c.googleCalendarName,
                },
            }));

        const result = await fetchAll(async (nextCursor) => {
            const res = await this.client.databases.query({
                database_id: this.context.user.notionDatabaseId,
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
                                on_or_after: this.context.config.timeMin,
                                on_or_before: this.context.config.timeMax,
                            },
                        },
                        {
                            or: writeAbleCalendarOptions,
                        },
                    ],
                },
            });
            return {
                results: res.results,
                nextCursor: res.next_cursor,
            };
        });

        return result;
    }

    async updateCalendarOptions(calendars: { name: string; id?: string }[]) {
        const props = this.context.user.parsedNotionProps;
        return await this.client.pages.update({
            page_id: this.context.user.notionDatabaseId,
            properties: {
                [props.calendar]: {
                    multi_select: calendars,
                },
            },
        });
    }

    async createPage(event: NotionEventDto) {
        const props = this.context.user.parsedNotionProps;
        return await this.client.pages.create({
            parent: {
                type: 'database_id',
                database_id: this.context.user.notionDatabaseId,
            },
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: event.title || '',
                            },
                        },
                    ],
                },
                [props.calendar]: {
                    type: 'select',
                    select: {
                        name: event.calendar.googleCalendarName,
                    },
                },
                [props.date]: {
                    type: 'date',
                    date: event.date,
                },
                [props.link]: {
                    type: 'url',
                    url: event.googleCalendarEventLink,
                },
                [props.description]: {
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
                [props.location]: {
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

    async updatePage(event: NotionEventDto) {
        const props = this.context.user.parsedNotionProps;
        return await this.client.pages.update({
            page_id: event.notionEventId,
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: event.title || '',
                            },
                        },
                    ],
                },
                [props.calendar]: {
                    type: 'select',
                    select: {
                        name: event.calendar.googleCalendarName,
                    },
                },
                [props.date]: {
                    type: 'date',
                    date: event.date,
                },
                [props.link]: {
                    type: 'url',
                    url: event.googleCalendarEventLink,
                },
                [props.description]: {
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
                [props.location]: {
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

    async deletePage(pageId: string) {
        try {
            return await this.client.pages.update({
                page_id: pageId,
                archived: true,
            });
        } catch (err) {
            if (
                err.message ===
                "Can't update a page that is archived. You must unarchive the page before updating."
            ) {
                return true;
            }

            if (err.status === 404) {
                return true;
            }

            throw err;
        }
    }

    /**
     * 노션 데이터베이스에 속성을 추가합니다
     * - 동일한 속성이 이미 있다면 해당 속성을 반환합니다
     * - 이름이 동일하고 타입이 다른 속성이 있다면 '이름 (1)' 형태의 속성을 만들고 반환합니다
     */
    async addProp(
        name: string,
        type:
            | 'last_edited_time'
            | 'checkbox'
            | 'date'
            | 'last_edited_time'
            | 'rich_text'
            | 'url',
    ) {
        let _name = name;
        const existDatabase = await this.getDatabase();
        if (existDatabase.properties[_name]) {
            if (existDatabase.properties[_name].type === type) {
                return existDatabase.properties[_name];
            } else {
                let i = 1;
                while (existDatabase.properties[_name]) {
                    _name = `${name} (${i})`;
                    i++;
                }
            }
        }
        const database = await this.client.databases.update({
            database_id: this.context.user.notionDatabaseId,
            properties: {
                [name]: {
                    name,
                    type,
                },
            },
        });
        const prop = database.properties[name];
        return prop;
    }
}
