import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { calendar_v3 } from 'googleapis';
import { transDate } from '../../utils/dateUtils';
import { TestEventObject, TestPageObject } from '../type/testObject';

export class NotionTester {
    client: Client;
    user: UserEntity;
    calendar: CalendarEntity;

    constructor() {
        this.client = new Client({
            auth: process.env.TEST_USER_NOTION_ACCESS_TOKEN,
        });
    }

    public init({
        user,
        calendar,
    }: {
        user: UserEntity;
        calendar: CalendarEntity;
    }) {
        this.user = user;
        this.calendar = calendar;
        this.client = new Client({
            auth: process.env.TEST_USER_NOTION_ACCESS_TOKEN,
        });
    }

    public async createTestDatabase(title: string) {
        return await this.client.databases.create({
            parent: {
                page_id: process.env.TEST_USER_NOTION_PARENT_PAGE_ID,
            },
            title: [
                {
                    type: 'text',
                    text: {
                        content: `${title} | ${new Date().toISOString()}`,
                    },
                },
            ],
            description: [
                {
                    text: {
                        content: `${new Date().toISOString()} 에 SyncBot Worker 테스트를 위해 진행된 테스트입니다.`,
                    },
                },
            ],
            properties: {
                title: {
                    title: {},
                },
                calendar: {
                    select: {},
                },
                date: {
                    date: {},
                },
                delete: {
                    checkbox: {},
                },
                description: {
                    rich_text: {},
                },
                location: {
                    rich_text: {},
                },
            },
        });
    }

    public async destroyTestDatabase(databaseId: string) {
        await this.client.databases.update({
            database_id: databaseId,
            archived: true,
        });
    }

    public async getPageByTitle(title: string): Promise<PageObjectResponse> {
        const res = await this.client.databases.query({
            database_id: this.user.notionDatabaseId,
            filter: {
                and: [
                    {
                        property: 'title',
                        title: {
                            equals: title,
                        },
                    },
                ],
            },
        });
        return res.results[0] as PageObjectResponse;
    }

    public async getPage(pageId: string) {
        const res = await this.client.pages.retrieve({
            page_id: pageId,
        });
        return res as PageObjectResponse;
    }

    public async getDatabase() {
        return await this.client.databases.retrieve({
            database_id: this.user.notionDatabaseId,
        });
    }

    /**
     * 인자로 받은 페이지가 testEventObject와 동일한지 비교 합니다.
     * @param page
     * @param testEventObject
     * @returns
     */
    public checkPage(
        page: PageObjectResponse,
        testEventObject: TestEventObject,
    ) {
        const errors = {
            title: false,
            date: false,
            description: false,
            location: false,
            calendar: false,
        };

        // title
        if (page.properties.title.type !== 'title') {
            console.error(
                `title 속성의 타입이 "title"이 아닙니다. ${page.properties.title.type}`,
            );
            errors.title = true;
        } else {
            if (
                page.properties.title.title[0].plain_text !==
                testEventObject.title
            ) {
                console.error(
                    `title의 값이 testEventObject의 내용과 다릅니다. ${page.properties.title.title[0].plain_text}, ${testEventObject.title}`,
                );
                errors.title = true;
            }
        }

        // date
        if (page.properties.date.type !== 'date') {
            console.error(
                `date 속성의 타입이 "date"가 아닙니다. ${page.properties.date.type}`,
            );
            errors.date = true;
        } else {
            const trancedDate = transDate.eventToNotion(testEventObject.date);
            if (
                new Date(
                    new Date(page.properties.date.date.start).toISOString(),
                ).getTime() !== new Date(trancedDate.start).getTime()
            ) {
                console.error(
                    `date의 start가 다릅니다. ${page.properties.date.date.start}, ${trancedDate.start}`,
                );
                errors.date = true;
            }
            if (
                new Date(
                    new Date(page.properties.date.date.end).toISOString(),
                ).getTime() !== new Date(trancedDate.end).getTime()
            ) {
                console.error(
                    `date의 end가 다릅니다. ${page.properties.date.date.end}, ${trancedDate.end}`,
                );
                errors.date = true;
            }
        }

        // calendar
        if (page.properties.calendar.type !== 'select') {
            console.error(
                `calendar의 타입이 select가 아닙니다. ${page.properties.calendar.type}`,
            );
            errors.calendar = true;
        } else {
            if (
                page.properties.calendar.select.name !==
                testEventObject.calendar.googleCalendarName
            ) {
                console.error(
                    `calendar의 선택된 캘린더의 이름이 다릅니다. ${page.properties.calendar.select.name}, ${testEventObject.calendar.googleCalendarName}`,
                );
                errors.calendar = true;
            }
        }

        // description
        if (page.properties.description.type !== 'rich_text') {
            console.error(
                `description의 타입이 rich_text가 아닙니다. ${page.properties.description.type}`,
            );
            errors.description = true;
        } else {
            if (
                page.properties.description.rich_text[0].plain_text !==
                testEventObject.description
            ) {
                console.error(
                    `description의 내용이 다릅니다. ${page.properties.description.rich_text[0].plain_text}, ${testEventObject.description}`,
                );
                errors.description = true;
            }
        }

        // location
        if (page.properties.location.type !== 'rich_text') {
            console.error(
                `location의 타입이 rich_text가 아닙니다. ${page.properties.location.type}`,
            );
            errors.location = true;
        } else {
            if (
                page.properties.location.rich_text[0].plain_text !==
                testEventObject.location
            ) {
                console.error(
                    `location의 내용이 다릅니다. ${page.properties.location.rich_text[0].plain_text}, ${testEventObject.location}`,
                );
                errors.location = true;
            }
        }

        return errors;
    }

    public async createPage(title: string): Promise<TestPageObject> {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);

        const res = await this.client.pages.create({
            parent: {
                database_id: this.user.notionDatabaseId,
            },
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                [props.calendar]: {
                    type: 'select',
                    select: {
                        id: this.calendar.notionPropertyId,
                    },
                },
                [props.date]: {
                    type: 'date',
                    date: transDate.eventToNotion(
                        transDate.gCalToEvent({
                            start: {
                                dateTime: '2022-10-27T01:00:00',
                            },
                            end: {
                                dateTime: '2022-10-28T01:00:00',
                            },
                        }),
                    ),
                },
                [props.description]: props.description && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: 'description',
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
                                content: 'location',
                            },
                        },
                    ],
                },
            },
        });

        return {
            calendar: this.calendar,
            date: transDate.gCalToEvent({
                start: {
                    dateTime: '2022-10-27T01:00:00',
                },
                end: {
                    dateTime: '2022-10-28T01:00:00',
                },
            }),
            description: 'description',
            from: 'notion',
            location: 'location',
            page: res as PageObjectResponse,
            title: title,
        };
    }

    public async editPage(
        testPageObject: TestPageObject,
    ): Promise<TestPageObject> {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);

        const res = await this.client.pages.update({
            page_id: testPageObject.page.id,
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: `edited_${testPageObject.title}`,
                            },
                        },
                    ],
                },
                [props.calendar]: {
                    type: 'select',
                    select: {
                        id: this.calendar.notionPropertyId,
                    },
                },
                [props.date]: {
                    type: 'date',
                    date: transDate.eventToNotion(
                        transDate.gCalToEvent({
                            start: {
                                dateTime: '2022-10-28T01:00:00',
                            },
                            end: {
                                dateTime: '2022-10-29T01:00:00',
                            },
                        }),
                    ),
                },
                [props.description]: props.description && {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: 'edited_description',
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
                                content: 'edited_location',
                            },
                        },
                    ],
                },
            },
        });

        return {
            calendar: this.calendar,
            date: transDate.gCalToEvent({
                start: {
                    dateTime: '2022-10-28T01:00:00',
                },
                end: {
                    dateTime: '2022-10-29T01:00:00',
                },
            }),
            description: 'edited_description',
            from: 'notion',
            location: 'edited_location',
            page: res as PageObjectResponse,
            title: `edited_${testPageObject.title}`,
        };
    }

    public async deletePage(testPageObject: TestPageObject) {
        await this.client.pages.update({
            page_id: testPageObject.page.id,
            properties: {
                delete: {
                    type: 'checkbox',
                    checkbox: true,
                },
            },
        });
    }
}
