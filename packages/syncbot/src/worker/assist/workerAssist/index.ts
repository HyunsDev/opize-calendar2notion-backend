import { CalendarEntity, EventEntity } from '@opize/calendar2notion-model';
import dayjs from 'dayjs';
import { calendar_v3 } from 'googleapis';
import { LessThan } from 'typeorm';

import { DB } from '../../../database';
import { WorkerContext } from '../../context/workerContext';
import { Assist } from '../../types/assist';
import { EventLinkAssist } from '../eventLinkAssist';
import { GoogleCalendarAssist } from '../googleCalendarAssist';
import { NotionAssist } from '../notionAssist';

export class WorkerAssist extends Assist {
    private context: WorkerContext;

    private eventLinkAssist: EventLinkAssist;
    private googleCalendarAssist: GoogleCalendarAssist;
    private notionAssist: NotionAssist;

    constructor({
        context,
        eventLinkAssist,
        googleCalendarAssist,
        notionAssist,
    }: {
        context: WorkerContext;
        eventLinkAssist: EventLinkAssist;
        googleCalendarAssist: GoogleCalendarAssist;
        notionAssist: NotionAssist;
    }) {
        super();
        this.context = context;
        this.eventLinkAssist = eventLinkAssist;
        this.googleCalendarAssist = googleCalendarAssist;
        this.notionAssist = notionAssist;
        this.assistName = 'WorkerAssist';
    }

    public async validation() {
        await this.notionAssist.validation();
        await this.googleCalendarAssist.validation();
    }

    public async eraseDeletedNotionPage() {
        const notionDeletedPageIds =
            await this.notionAssist.getDeletedPageIds();
        for (const pageId of notionDeletedPageIds) {
            await this.eraseNotionPage(pageId);
        }
        this.context.result.eraseDeletedEvent.notion =
            notionDeletedPageIds.length;
    }

    public async eraseDeletedEventLink() {
        const deletedEventLinks =
            await this.eventLinkAssist.findDeletedEventLinks();
        for (const eventLink of deletedEventLinks) {
            await this.eraseEvent(eventLink);
        }
        this.context.result.eraseDeletedEvent.eventLink =
            deletedEventLinks.length;
    }

    private async eraseNotionPage(pageId: string) {
        const eventLink = await this.eventLinkAssist.findByNotionPageId(pageId);
        if (eventLink) {
            await this.eraseEvent(eventLink);
        } else {
            await this.notionAssist.deletePage(pageId);
        }
    }

    private async eraseEvent(eventLink: EventEntity) {
        await this.notionAssist.deletePage(eventLink.notionPageId);
        if (eventLink.calendar.accessRole !== 'reader') {
            await this.googleCalendarAssist.deleteEvent(
                eventLink.googleCalendarEventId,
                eventLink.googleCalendarCalendarId,
            );
        }
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

    public async startSyncUserUpdate() {
        await DB.user.update(this.context.user.id, {
            workStartedAt: this.context.user.lastCalendarSync,
            isWork: true,
            syncbotId: process.env.SYNCBOT_PREFIX,
        });
    }

    public async endSyncUserUpdate() {
        await DB.user.update(this.context.user.id, {
            workStartedAt: '',
            lastSyncStatus: '',
            isWork: false,
            syncbotId: null,
            lastCalendarSync: new Date(),
        });
    }

    public async deleteOldErrorLogs() {
        await DB.errorLog.delete({
            userId: this.context.user.id,
            createdAt: LessThan(dayjs().add(-21, 'days').toDate()),
            archive: false,
        });
    }

    public async syncNewCalendar(newCalendar: CalendarEntity) {
        this.context.result.syncNewCalendar[`${newCalendar.id}`] = {
            id: newCalendar.id,
            gCalId: newCalendar.googleCalendarId,
            gCalName: newCalendar.googleCalendarName,
            eventCount: 0,
        };

        await DB.calendar.update(newCalendar.id, {
            status: 'CONNECTED',
        });

        await this.notionAssist.addCalendarProp(newCalendar);
        const events = await this.googleCalendarAssist.getEventByCalendar(
            newCalendar.googleCalendarId,
        );

        const calendar = await DB.calendar.findOne({
            where: {
                id: newCalendar.id,
            },
        });
        for (const event of events) {
            await this.addEventByGCal(event, calendar);
        }

        this.context.result.syncNewCalendar[`${calendar.id}`].eventCount =
            events.length;
    }
}
