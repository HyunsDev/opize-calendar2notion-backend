import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { calendar_v3 } from 'googleapis';

import { SyncErrorBoundary } from '../../decorator/errorBoundary.decorator';
import { Assist } from '../../types/assist';
import { SyncConfig } from '../../types/syncConfig';
import { EventLinkAssist } from '../eventLinkAssist';

import { GoogleCalendarAssistApi } from './api';
dayjs.extend(utc);
dayjs.extend(timezone);

export class GoogleCalendarAssist extends Assist {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private eventLinkAssist: EventLinkAssist;
    private api: GoogleCalendarAssistApi;
    private config: SyncConfig;

    constructor({
        user,
        calendars,
        eventLinkAssist,
        startedAt,
        config,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        eventLinkAssist: EventLinkAssist;
        startedAt: Date;
        config: SyncConfig;
    }) {
        super();
        this.user = user;
        this.calendars = calendars;
        this.eventLinkAssist = eventLinkAssist;
        this.assistName = 'GoogleAssist';
        this.config = config;
        this.api = new GoogleCalendarAssistApi({
            calendars,
            startedAt,
            user,
            config: this.config,
        });
    }

    @SyncErrorBoundary('validation')
    public async validation() {
        return true;
    }

    @SyncErrorBoundary('deleteEvent')
    public async deleteEvent(eventId: string, calendarId: string) {
        return await this.api.deleteEvent(eventId, calendarId);
    }

    @SyncErrorBoundary('getEventByCalendar')
    public async getEventByCalendar(calendarId: string) {
        return await this.api.getEventByCalendar(calendarId);
    }

    @SyncErrorBoundary('getUpdatedEvents')
    public async getUpdatedEvents() {
        const calendars = this.calendars.filter(
            (e) => e.status === 'CONNECTED',
        );

        const res: {
            calendar: CalendarEntity;
            events: calendar_v3.Schema$Event[];
        }[] = [];
        for (const calendar of calendars) {
            res.push({
                calendar,
                events: await this.api.getUpdatedEventsByCalendar(calendar),
            });
        }
        return res;
    }

    @SyncErrorBoundary('CUDEvent')
    public async CUDEvent(page: PageObjectResponse) {
        const props: {
            title: string;
            calendar: string;
            date: string;
            delete: string;
            link?: string;
            description?: string;
            location?: string;
        } = JSON.parse(this.user.notionProps);
        const eventLink = await this.eventLinkAssist.findByNotionPageId(
            page.id,
        );

        const notionCalendarId = (
            Object.values(page.properties).find(
                (e) => e.id === props.calendar,
            ) as any
        ).select.id;
        const calendar = this.calendars.find(
            (e) => e.notionPropertyId === notionCalendarId,
        );

        if (!calendar) {
            console.log('calendar not found');
            return;
        }

        if (eventLink && eventLink.googleCalendarEventId) {
            const notionEventUpdated = new Date(page.last_edited_time);
            const userUpdated = dayjs(this.user.lastCalendarSync)
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
