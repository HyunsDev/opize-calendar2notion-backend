import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CalendarEntity, EventEntity } from '@opize/calendar2notion-object';
import { calendar_v3 } from 'googleapis';

export interface ProtoEventConstructorProps {
    eventSource: ProtoEvent['eventSource'];

    eventId?: number;
    googleCalendarEventId?: string;
    notionEventId?: string;
    calendar: CalendarEntity;
    isSynced?: boolean;

    eventLink?: EventEntity;
    originalNotionEvent?: PageObjectResponse;
    originalGoogleCalendarEvent?: calendar_v3.Schema$Event;
}

export abstract class ProtoEvent {
    eventSource: 'event' | 'notion' | 'googleCalendar' | 'eventLink';

    eventId?: number;
    googleCalendarEventId?: string;
    notionEventId?: string;
    calendar: CalendarEntity;
    isSynced?: boolean;

    readonly eventLink?: EventEntity;
    readonly originalNotionEvent?: PageObjectResponse;
    readonly originalGoogleCalendarEvent?: calendar_v3.Schema$Event;

    constructor(data: ProtoEventConstructorProps) {
        this.eventSource = data.eventSource;

        this.eventId = data.eventId;
        this.googleCalendarEventId = data.googleCalendarEventId;
        this.calendar = data.calendar;
        this.notionEventId = data.notionEventId;
        this.isSynced = data.isSynced;

        this.eventLink = data.eventLink;
        this.originalNotionEvent = data.originalNotionEvent;
        this.originalGoogleCalendarEvent = data.originalGoogleCalendarEvent;
    }
}
