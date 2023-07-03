export type WorkerStep =
    | 'init'
    | 'startSync'
    | 'validation'
    | 'eraseDeletedEvent'
    | 'syncEvents'
    | 'syncNewCalendar'
    | 'endSync';
export type WorkerResult = {
    step: WorkerStep;
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
