import { SyncContext } from '@/contexts/sync.context';
import { DB } from '@/database';
import { EventDto } from '@/dto/Event';
import { Injectable } from '@/libs/dependency';

@Injectable()
export class EventLinkService {
    private readonly context: SyncContext;

    constructor(syncContext: SyncContext) {
        this.context = syncContext;
    }

    async getEventWithEventLink(event: EventDto): Promise<EventDto> {
        const eventLink = await DB.event.findOne({
            where: [
                {
                    notionPageId: event.notionEventId,
                    userId: this.context.user.id,
                },
                {
                    googleCalendarEventId: event.googleCalendarEventId,
                    googleCalendarCalendarId: event.calendar.googleCalendarId,
                    userId: this.context.user.id,
                },
            ],
            relations: ['calendar'],
        });

        if (!eventLink) {
            const newEvent = new EventDto({
                ...event,
                eventLink: undefined,
                isSynced: false,
            });
            return newEvent;
        } else {
            const newEvent = new EventDto({
                ...event,
                isSynced: true,

                eventId: eventLink.id,
                googleCalendarEventId: eventLink.googleCalendarEventId,
                notionEventId: eventLink.notionPageId,

                eventLink,
            });
            return newEvent;
        }
    }

    async getDeletedEventLinks() {
        const eventLinks = await DB.event.find({
            where: {
                userId: this.context.user.id,
                willRemove: true,
            },
            relations: ['calendar'],
        });
        return eventLinks;
    }
}
