import { CalendarEntity } from '@opize/calendar2notion-object';

import { SyncContext } from '@/contexts/sync.context';
import { EventDto } from '@/dto/Event';
import { GoogleCalendarEventDto } from '@/dto/GoogleCalendarEvent';
import { Injectable } from '@/libs/dependency';

import { GoogleCalendarAPIService } from './googleCalendar.api.service';

@Injectable()
export class GoogleCalendarService {
    private readonly api: GoogleCalendarAPIService;
    private readonly context: SyncContext;

    constructor(syncContext: SyncContext) {
        this.context = syncContext;
        this.api = new GoogleCalendarAPIService(syncContext);
    }

    /**
     * 캘린더 초기화를 위해 캘린더에 있는 모든 이벤트를 가져옵니다.
     * eventLink를 조회하지 않으며, 모두 새로운 이벤트로 취급합니다.
     */
    async getEventsByCalendarForInit(
        calendar: CalendarEntity,
    ): Promise<EventDto[]> {
        const res = await this.api.getEventsByCalendar(calendar);
        return res.map((event) => event.toEvent());
    }

    async getUpdatedEvents(): Promise<EventDto[]> {
        const calendars = this.context.calendars.filter(
            (calendar) => calendar.status === 'CONNECTED',
        );
        const events: GoogleCalendarEventDto[] = [];
        for (const calendar of calendars) {
            const res = await this.api.getUpdatedEventsByCalendar(calendar);
            events.push(...res);
        }
        return events.map((event) => event.toEvent());
    }

    async CUDEvent(event: EventDto): Promise<void> {
        if (event.calendar.accessRole === 'reader') {
            return;
        }

        if (event.googleCalendarEventId) {
        }
    }
}
