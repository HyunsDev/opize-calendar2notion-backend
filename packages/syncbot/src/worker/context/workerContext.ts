import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';

import { WorkerResult } from '../types/result';
import { SyncConfig } from '../types/syncConfig';

export class WorkerContext {
    workerId: string;
    startedAt: Date;
    userId: number;
    config: SyncConfig;

    result: WorkerResult;

    user: UserEntity;
    calendars: CalendarEntity[];

    constructor(workerId: string, userId: number, startedAt: Date) {
        this.workerId = workerId;
        this.startedAt = startedAt;
        this.userId = userId;

        this.result = {
            step: 'init',
            fail: false,
            eraseDeletedEvent: {
                notion: -1,
                eventLink: -1,
            },
            syncEvents: {
                gCalCalendarCount: -1,
                notion2GCalCount: -1,
                gCal2NotionCount: -1,
            },
            syncNewCalendar: {},
            simpleResponse: '',
        };
    }

    private updateSimpleResult() {
        this.result.simpleResponse = [
            this.user.id,
            this.result?.fail ? 'FAIL' : 'SUCCESS',
            this.result?.step,
            this.result?.eraseDeletedEvent?.notion,
            this.result?.eraseDeletedEvent?.eventLink,
            this.result?.syncEvents?.gCalCalendarCount,
            this.result?.syncEvents?.gCal2NotionCount,
            this.result?.syncEvents?.notion2GCalCount,
            Object.keys(this?.result?.syncNewCalendar || {})?.length,
            Object.values(this?.result?.syncNewCalendar || {}).reduce(
                (pre, cur) => pre + cur?.eventCount,
                0,
            ),
            Math.round(new Date().getTime() - this.startedAt.getTime()) / 1000,
        ].join(' ');
    }

    getResult() {
        this.updateSimpleResult();
        return this.result;
    }
}
