import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { calendar_v3 } from 'googleapis';

import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { EventLinkAssist } from '../eventLinkAssist';
import { Assist } from '../../types/assist';
import { SyncErrorBoundary } from '../../decorator/errorBoundary.decorator';
import { GoogleCalendarAssistApi } from './api';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

dayjs.extend(utc);
dayjs.extend(timezone);
export class GoogleCalendarAssist extends Assist {
    private user: UserEntity;
    private calendars: CalendarEntity[];
    private eventLinkAssist: EventLinkAssist;
    private api: GoogleCalendarAssistApi;

    constructor({
        user,
        calendars,
        eventLinkAssist,
        startedAt,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        eventLinkAssist: EventLinkAssist;
        startedAt: Date;
    }) {
        super();
        this.user = user;
        this.calendars = calendars;
        this.eventLinkAssist = eventLinkAssist;
        this.assistName = 'GoogleAssist';
        this.api = new GoogleCalendarAssistApi({
            calendars,
            startedAt,
            user,
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

        if (eventLink && eventLink.googleCalendarEventId) {
            const notionEventUpdated = new Date(page.last_edited_time);
            const userUpdated = new Date(this.user.lastCalendarSync);
            // const eventLinkUpdated = new Date(eventLink.lastNotionUpdate);
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
