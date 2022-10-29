import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { CalendarEntity } from '@opize/calendar2notion-model';
import { calendar_v3 } from 'googleapis';
import { EventDateTime } from '../../utils/dateUtils';

export type TestObject = {
    title: string;
    date: EventDateTime;
    calendar: CalendarEntity;
    description: string;
    location: string;
};

export type TestEventObject = TestObject & {
    from: 'googleCalendar';
    event: calendar_v3.Schema$Event;
};

export type TestPageObject = TestObject & {
    from: 'notion';
    page: PageObjectResponse;
};
