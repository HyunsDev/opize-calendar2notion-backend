import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { calendar_v3 } from 'googleapis';

import { Assist } from '../../types/assist';
import { DatabaseAssist } from '../databaseAssist';
import { EventLinkAssist } from '../eventLinkAssist';
import { GoogleCalendarAssist } from '../googleCalendarAssist';
import { NotionAssist } from '../notionAssist';

export class WorkerAssist extends Assist {
    private user: UserEntity;

    private databaseAssist: DatabaseAssist;
    private eventLinkAssist: EventLinkAssist;
    private googleCalendarAssist: GoogleCalendarAssist;
    private notionAssist: NotionAssist;
    private calendars: CalendarEntity[];
    private startedAt: Date;

    constructor({
        user,
        calendars,
        databaseAssist,
        eventLinkAssist,
        googleCalendarAssist,
        notionAssist,
        startedAt,
    }: {
        user: UserEntity;
        calendars: CalendarEntity[];
        databaseAssist: DatabaseAssist;
        eventLinkAssist: EventLinkAssist;
        googleCalendarAssist: GoogleCalendarAssist;
        notionAssist: NotionAssist;
        startedAt: Date;
    }) {
        super();
        this.user = user;
        this.calendars = calendars;
        this.databaseAssist = databaseAssist;
        this.eventLinkAssist = eventLinkAssist;
        this.googleCalendarAssist = googleCalendarAssist;
        this.notionAssist = notionAssist;
        this.startedAt = startedAt;
        this.assistName = 'WorkerAssist';
    }

    public async eraseNotionPage(pageId: string) {
        const eventLink = await this.eventLinkAssist.findByNotionPageId(pageId);
        if (eventLink) {
            await this.eraseEvent(eventLink);
        } else {
            await this.notionAssist.deletePage(pageId);
        }
    }

    public async eraseEvent(eventLink: EventEntity) {
        await this.notionAssist.deletePage(eventLink.notionPageId);
        await this.googleCalendarAssist.deleteEvent(
            eventLink.googleCalendarEventId,
            eventLink.googleCalendarCalendarId,
        );
        await this.eventLinkAssist.deleteEventLink(eventLink);
    }

    public async addEventByGCal(
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ) {
        const page = await this.notionAssist.addPage(event, calendar);
        await this.eventLinkAssist.create(page, event, calendar);
        return page;
    }
}
