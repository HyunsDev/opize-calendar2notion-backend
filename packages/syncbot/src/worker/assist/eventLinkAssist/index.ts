import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { DB } from '../../../database';
import { calendar_v3 } from 'googleapis';
import { PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export class EventLinkAssist {
    user: UserEntity;

    constructor({ user }: { user: UserEntity }) {
        this.user = user;
    }

    public async findByNotionPageId(pageId: string) {
        return await DB.event.findOne({
            where: {
                notionPageId: pageId,
                userId: this.user.id,
            },
        });
    }

    public async findByGCalEvent(gCalEventId: string, gCalCalendarId: string) {
        return await DB.event.findOne({
            where: {
                googleCalendarCalendarId: gCalCalendarId,
                googleCalendarEventId: gCalEventId,
                userId: this.user.id,
            },
        });
    }

    public async findDeletedEventLinks() {
        return await DB.event.find({
            where: {
                userId: this.user.id,
                willRemove: true,
            },
        });
    }

    public async deleteEventLink(eventLink: EventEntity) {
        return await DB.event.delete({
            id: eventLink.id,
            userId: this.user.id,
        });
    }

    public async updateCalendar(
        eventLink: EventEntity,
        calendar: CalendarEntity,
    ) {
        eventLink.calendar = calendar;
        eventLink.googleCalendarCalendarId = calendar.googleCalendarId;
        return await DB.event.save(eventLink);
    }

    public async updateLastNotionUpdate(eventLink: EventEntity) {
        eventLink.lastNotionUpdate = new Date();
        return await DB.event.save(eventLink);
    }

    public async updateLastGCalUpdate(eventLink: EventEntity) {
        eventLink.lastGoogleCalendarUpdate = new Date();
        return await DB.event.save(eventLink);
    }

    public async create(
        page: PartialPageObjectResponse,
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ) {
        const eventLink = new EventEntity();
        eventLink.calendar = calendar;
        eventLink.googleCalendarCalendarId = calendar.googleCalendarId;
        eventLink.googleCalendarEventId = event.id;
        eventLink.lastGoogleCalendarUpdate = new Date(event.updated);
        eventLink.lastNotionUpdate = new Date();
        eventLink.status = 'SYNCED';
        eventLink.user = this.user;
        eventLink.willRemove = false;
        eventLink.notionPageId = page.id;
        await DB.event.save(eventLink);
    }
}
