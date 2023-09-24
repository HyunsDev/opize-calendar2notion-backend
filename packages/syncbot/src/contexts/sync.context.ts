import { CalendarEntity, UserEntity } from '@opize/calendar2notion-object';

export class SyncContext {
    user: UserEntity;
    calendars: CalendarEntity[];
    config: {
        timeMin: string;
        timeMax: string;
    };
}
