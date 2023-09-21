import { CalendarEntity } from '@opize/calendar2notion-object';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { calendar_v3, google } from 'googleapis';

import { SyncErrorCode } from '../../error';
import { NotionSyncError } from '../../error/notion.error';
import { Assist } from '../../types/assist';
import { EventLinkAssist } from '../eventLinkAssist';

import { NotionAssistApi } from './api';
import { WorkContext } from '../../context/work.context';
import { DB } from '@/database';
import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

dayjs.extend(utc);
dayjs.extend(timezone);

export class NotionAssist extends Assist {
    private context: WorkContext;

    private api: NotionAssistApi;
    private eventLinkAssist: EventLinkAssist;

    constructor({
        context,
        eventLinkAssist,
    }: {
        context: WorkContext;
        eventLinkAssist: EventLinkAssist;
    }) {
        super();
        this.context = context;
        this.eventLinkAssist = eventLinkAssist;
        this.assistName = 'NotionAssist';

        this.api = new NotionAssistApi({
            context: this.context,
        });
    }

    public async validation() {
        const database = await this.api.getDatabase();
        this.checkProps(database);
    }

    public async getDeletedPageIds() {
        return await this.api.getDeletedPageIds();
    }

    public async addCalendarProp(calendar: CalendarEntity) {
        // 속성 추가
        const calendarOptions = this.getCalendarOptions();
        calendarOptions.push({
            name: calendar.googleCalendarName,
            id: undefined,
        });
        const database = await this.api.updateCalendarProps(calendarOptions);

        // 새로운 속성 찾기
        const calendarProp: string = JSON.parse(
            this.context.user.notionProps,
        ).calendar;
        const oldPropIds = this.context.calendars.map(
            (e) => e.notionPropertyId,
        );
        const newProp: {
            id: string;
            name: string;
            color: string;
        } = Object.values(
            (
                Object.values(database.properties).find(
                    (e) => e.id === calendarProp,
                ) as any
            ).select.options,
        ).filter((e: any) => !oldPropIds.includes(e.id))[0] as any;

        await DB.calendar.update(calendar.id, {
            notionPropertyId: newProp.id,
        });
    }

    public async deletePage(pageId: string) {
        await this.api.deletePage(pageId);
    }

    public async addPage(
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ) {
        const page = await this.api.createPage(event, calendar);
        return page;
    }

    public async getUpdatedPages() {
        const updatedPages = await this.api.getUpdatedPages();
        this.context.result.syncEvents.notion2GCalCount = updatedPages.length;
        return updatedPages;
    }

    public async getPages() {
        const pages = await this.api.getPages();
        return pages;
    }

    public async CUDPage(
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ) {
        const eventLink = await this.eventLinkAssist.findByGCalEvent(
            event.id,
            calendar.googleCalendarId,
        );

        if (eventLink && eventLink.notionPageId) {
            const gCalEventUpdated = dayjs(event.updated);
            const userUpdated = dayjs(this.context.user.lastCalendarSync);
            // const eventLinkUpdated = new Date(
            //     eventLink.lastGoogleCalendarUpdate,
            // );

            // 이미 업데이트 된 이벤트
            if (gCalEventUpdated < userUpdated) {
                return;
            }

            // 취소된 이벤트
            if (event.status === 'cancelled') {
                await this.deletePage(eventLink.notionPageId);
                await this.eventLinkAssist.deleteEventLink(eventLink);
                return true;
            }

            // 캘린더 이동
            if (
                eventLink.googleCalendarCalendarId !== calendar.googleCalendarId
            ) {
                // 노션 페이지 calendar 속성은 update에서 적용되므로 이곳에서는 적용하지 않음
                await this.eventLinkAssist.updateCalendar(eventLink, calendar);
            }

            await this.api.updatePage(eventLink, event, calendar);
            await this.eventLinkAssist.updateLastNotionUpdate(eventLink);
            return;
        } else {
            if (event.status === 'cancelled') return;
            const page = await this.api.createPage(event, calendar);
            await this.eventLinkAssist.create(page, event, calendar);
        }
    }

    private checkProps(database: GetDatabaseResponse) {
        const userProps: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
        } = JSON.parse(this.context.user.notionProps);

        const requiredProps = ['title', 'calendar', 'date', 'delete'];

        const propsMap = {
            title: 'title',
            calendar: 'select',
            date: 'date',
            delete: 'checkbox',
            link: 'url',
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
            const prop = Object.values(database.properties).find(
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
            if (propsMap[userProp] && prop.type !== propsMap[userProp]) {
                // 정해진 타입과 일치하지 않음
                errors.push({
                    error: 'wrong_prop_type',
                    message: `${userProp} 속성의 유형이 올바르지 않습니다. (기대한 타입: ${propsMap[userProp]}, 실제 타입: ${prop.type})`,
                });
                continue;
            }
        }

        if (errors.length !== 0) {
            throw new NotionSyncError({
                code: SyncErrorCode.notion.sync.VALIDATION_ERROR,
                user: this.context.user,
                detail: errors
                    .map((e) => `${e.error}: ${e.message}`)
                    .join('\n'),
            });
        }

        return true;
    }

    private getCalendarOptions(): {
        id?: string;
        name: string;
    }[] {
        return this.context.calendars
            .filter((e) => e.notionPropertyId)
            .map((e) => ({
                id: e.notionPropertyId,
                name: e.googleCalendarName,
            }));
    }
}
