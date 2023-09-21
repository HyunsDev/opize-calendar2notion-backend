import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CalendarEntity } from '@opize/calendar2notion-object';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { calendar_v3 } from 'googleapis';

import { Assist } from '../../types/assist';
import { EventLinkAssist } from '../eventLinkAssist';

import { GoogleCalendarAssistApi } from './api';
import { WorkContext } from '../../context/work.context';
dayjs.extend(utc);
dayjs.extend(timezone);

export class GoogleCalendarAssist extends Assist {
    private context: WorkContext;

    private eventLinkAssist: EventLinkAssist;
    private api: GoogleCalendarAssistApi;

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
        this.assistName = 'GoogleAssist';
        this.api = new GoogleCalendarAssistApi({
            context,
        });
    }

    public async validation() {
        return true;
    }

    public async deleteEvent(eventId: string, calendarId: string) {
        return await this.api.deleteEvent(eventId, calendarId);
    }

    public async getEventByCalendar(calendarId: string) {
        return await this.api.getEventByCalendar(calendarId);
    }

    public async getUpdatedEvents() {
        const connectedCalendars = this.context.calendars.filter(
            (e) => e.status === 'CONNECTED',
        );

        const res: {
            calendar: CalendarEntity;
            events: calendar_v3.Schema$Event[];
        }[] = [];

        for (const calendar of connectedCalendars) {
            res.push({
                calendar,
                events: await this.api.getUpdatedEventsByCalendar(calendar),
            });
        }

        this.context.result.syncEvents.gCalCalendarCount = res.length;
        this.context.result.syncEvents.gCal2NotionCount = res.reduce(
            (pre, cur) => pre + cur.events?.length || 0,
            0,
        );
        return res;
    }

    public async CUDEvent(page: PageObjectResponse) {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
        } = JSON.parse(this.context.user.notionProps);
        const eventLink = await this.eventLinkAssist.findByNotionPageId(
            page.id,
        );

        const notionCalendarId = (
            Object.values(page.properties).find(
                (e) => e.id === props.calendar,
            ) as any
        ).select.id;
        const calendar = this.context.calendars.find(
            (e) => e.notionPropertyId === notionCalendarId,
        );

        if (!calendar) {
            // 캘린더가 없는 경우 처리하지 않음
            return;
        }

        if (calendar.accessRole === 'reader') {
            // 캘린더가 읽기 전용인 경우 처리하지 않음
            return;
        }

        if (eventLink && eventLink.googleCalendarEventId) {
            const notionEventUpdated = new Date(page.last_edited_time);
            const userUpdated = dayjs(this.context.user.lastCalendarSync)
                .tz('Asia/Seoul')
                .add(-1, 'minute')
                .toDate();
            // const eventLinkUpdated = new Date(eventLink.lastNotionUpdate);

            // 이미 업데이트 된 일정
            if (notionEventUpdated < userUpdated) return;
            // if (notionEventUpdated <= eventLinkUpdated) return;

            // 캘린더 이동
            if (
                eventLink.googleCalendarCalendarId !== calendar.googleCalendarId
            ) {
                await this.api.moveCalendar(
                    eventLink.googleCalendarEventId,
                    eventLink.googleCalendarCalendarId,
                    calendar,
                );
                await this.eventLinkAssist.updateCalendar(eventLink, calendar);
            }

            // 이벤트 수정
            await this.api.updateEvent(eventLink, page);
            await this.eventLinkAssist.updateLastGCalUpdate(eventLink);
            return;
        } else {
            const event = await this.api.createEvent(calendar, page);
            await this.eventLinkAssist.create(page, event, calendar);
            return;
        }
    }
}
