export class LiveCheckDto {
    prefix: string;
    data: {
        prefix: string;
        workerId: string;
        userId: number;
        finishedAt: string;
        result: {
            step:
                | 'init'
                | 'startSync'
                | 'validation'
                | 'eraseDeletedEvent'
                | 'syncEvents'
                | 'syncNewCalendar'
                | 'endSync';
            fail: boolean;
            eraseDeletedEvent?: {
                notion: number;
                eventLink: number;
            };
            syncEvents?: {
                gCalCalendarCount: number;
                notion2GCalCount: number;
                gCal2NotionCount: number;
            };
            syncNewCalendar?: {
                [key: string]: {
                    id: number;
                    gCalId: string;
                    gCalName: string;
                    eventCount: number;
                };
            };
            simpleResponse?: string;
        };
    };
}
