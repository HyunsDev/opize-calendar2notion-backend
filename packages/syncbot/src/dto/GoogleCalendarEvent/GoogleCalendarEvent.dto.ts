import { CalendarEntity } from '@opize/calendar2notion-object';
import { calendar_v3 } from 'googleapis';

import { EventDateTime, EventDto } from '../Event';
import {
    ProtoEvent,
    ProtoEventConstructorProps,
} from '../ProtoEvent/ProtoEvent';

import { GoogleCalendarDateTime } from './GoogleCalendarDateTime.type';

export interface GoogleCalendarEventConstructorProps
    extends ProtoEventConstructorProps {
    summary: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    location?: string;
    description?: string;
    date: GoogleCalendarDateTime;
    googleCalendarEventLink?: string;
}

/**
 * Google Calendar의 이벤트와 Event를 사이를 연결하기 위한 DTO
 */
export class GoogleCalendarEventDto extends ProtoEvent {
    summary: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    location?: string;
    description?: string;
    date: GoogleCalendarDateTime;
    googleCalendarEventLink?: string;

    constructor(data: GoogleCalendarEventConstructorProps) {
        super(data);
        this.summary = data.summary;
        this.status = data.status;
        this.location = data.location;
        this.description = data.description;
        this.date = data.date;
    }

    /**
     * `Event`를 받아 `GoogleCalendarEvent`로 변환합니다.
     */
    static fromEvent(event: EventDto): GoogleCalendarEventDto {
        const googleCalendarEvent = new GoogleCalendarEventDto({
            eventSource: 'event',

            eventId: event.eventId,
            notionEventId: event.notionEventId,
            googleCalendarEventId: event.googleCalendarEventId,
            calendar: event.calendar,

            date: event.date,
            status: event.status,
            summary: event.title,
            location: event.location,
            description: event.description,
            googleCalendarEventLink: event.googleCalendarEventLink,

            eventLink: event.eventLink,
            originalNotionEvent: event.originalNotionEvent,
            originalGoogleCalendarEvent: event.originalGoogleCalendarEvent,
        });
        return googleCalendarEvent;
    }

    /**
     * `calendar_v3.Schema$Event`를 받아 `GoogleCalendarEvent`로 변환합니다.
     */
    static fromGoogleCalendar(
        originalEvent: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ): GoogleCalendarEventDto {
        const googleCalendarEvent = new GoogleCalendarEventDto({
            eventSource: 'googleCalendar',

            eventId: undefined,
            notionEventId: undefined,
            googleCalendarEventId: originalEvent.id,
            calendar,
            date: GoogleCalendarEventDto.convertDateFromEvent({
                start: originalEvent.start,
                end: originalEvent.end,
            }),
            status: originalEvent.status as
                | 'confirmed'
                | 'tentative'
                | 'cancelled',
            summary: originalEvent.summary,
            location: originalEvent.location,
            description: originalEvent.description,
            googleCalendarEventLink: originalEvent.htmlLink,

            originalGoogleCalendarEvent: originalEvent,
        });
        return googleCalendarEvent;
    }

    /**
     * `GoogleCalendarEvent`를 `Event`로 변환합니다.
     */
    toEvent() {
        const event = new EventDto({
            eventSource: this.eventSource,

            eventId: this.eventId,
            notionEventId: this.notionEventId,
            googleCalendarEventId: this.googleCalendarEventId,
            calendar: this.calendar,

            date: GoogleCalendarEventDto.convertDateToEvent(this.date),
            status: this.status,
            title: this.summary,
            location: this.location,
            description: this.description,
            googleCalendarEventLink: this.googleCalendarEventLink,

            originalGoogleCalendarEvent: this.originalGoogleCalendarEvent,
        });
        return event;
    }

    static convertDateToEvent(
        googleCalendarEvent: GoogleCalendarDateTime,
    ): EventDateTime {
        return googleCalendarEvent;
    }

    static convertDateFromEvent(
        eventDate: EventDateTime,
    ): GoogleCalendarDateTime {
        return eventDate;
    }
}
