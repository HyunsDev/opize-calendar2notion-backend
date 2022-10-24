import { APIResponseError, Client } from '@notionhq/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { retry } from '../../../utils';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { DatabaseAssist } from '../databaseAssist';
import { EventLinkAssist } from '../eventLinkAssest';
import { Assist } from '../../types/assist';
import { DB } from 'src/database';
import { SyncError } from '../../error/error';
import { SyncErrorBoundary } from '../../decorator/errorBoundary.decorator';

dayjs.extend(utc);
dayjs.extend(timezone);

export class NotionAssist extends Assist {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private client: Client;
    private startedAt: Date;
    private databaseAssist: DatabaseAssist;
    private eventLinkAssist: EventLinkAssist;

    constructor({
        user,
        calendars,
        databaseAssist,
        eventLinkAssist,
        startedAt,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        databaseAssist: DatabaseAssist;
        eventLinkAssist: EventLinkAssist;
        startedAt: Date;
    }) {
        super();
        this.user = user;
        this.calendars = calendars;
        this.eventLinkAssist = eventLinkAssist;
        this.databaseAssist = databaseAssist;
        this.startedAt = startedAt;
        this.assistName = 'NotionAssist';

        this.client = new Client({
            auth: this.user.notionAccessToken,
        });
    }

    @SyncErrorBoundary('validation')
    public async validation() {
        await this.checkProps();
    }

    @retry()
    private async checkProps() {
        const res = await this.getDatabase();

        const userProps: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);

        const requiredProps = ['title', 'calendar', 'date', 'delete'];

        const propsMap = {
            title: 'title',
            calendar: 'select',
            date: 'date',
            delete: 'checkbox',
            link: 'url',
            description: 'rich_text',
            location: 'rich_text',
        };

        const errors: {
            error: string;
            message: string;
        }[] = [];

        for (const prop of requiredProps) {
            if (!userProps[prop]) {
                errors.push({
                    error: 'prop_not_exist',
                    message: `필수 속성인 ${prop} 이(가) 없습니다`,
                });
            }
        }

        for (const userProp in userProps) {
            const prop = Object.values(res.properties).find(
                (e) => e.id === userProps[userProp],
            );
            if (!prop) {
                // 해당 prop이 존재 하지 않음
                errors.push({
                    error: 'prop_not_found',
                    message: `${userProp}에 해당하는 속성을 찾을 수 없습니다. (아이디: ${userProps[userProp]})`,
                });
                continue;
            }
            if (prop.type !== propsMap[userProp]) {
                // 정해진 타입과 일치하지 않음
                errors.push({
                    error: 'wrong_prop_type',
                    message: `${userProp} 속성의 유형이 올바르지 않습니다. (기대한 타입: ${propsMap[userProp]}, 실제 타입: ${prop.type})`,
                });
                continue;
            }
        }

        // TODO: KnownError 추가 필요
        if (errors.length !== 0) {
            // 유효성 검증 단계에서 문제 발생
            throw new SyncError({
                code: 'notion_validation_error',
                archive: false,
                description: '노션 유효성 체크에서 문제가 발견되었습니다.',
                from: 'NOTION',
                level: 'ERROR',
                user: this.user,
                showUser: true,
                detail:
                    `function: checkProps\n` +
                    errors.map((e) => `${e.error} (${e.message})`).join('\n'),
            });
        }

        return true;
    }

    @retry()
    private async getDatabase() {
        try {
            return await this.client.databases.retrieve({
                database_id: this.user.notionDatabaseId,
            });
        } catch (err: unknown) {
            if (err instanceof APIResponseError) {
                if (err.status === 404) {
                    throw new SyncError({
                        code: 'notion_database_not_found',
                        description: '데이터베이스를 찾을 수 없어요.',
                        from: 'NOTION',
                        level: 'ERROR',
                        user: this.user,
                        archive: false,
                        showUser: true,
                    });
                } else {
                    throw err;
                }
            }
        }
    }

    @retry()
    private async getProp(pageId: string, propertyId: string) {
        return await this.client.pages.properties.retrieve({
            page_id: pageId,
            property_id: propertyId,
        });
    }
}
