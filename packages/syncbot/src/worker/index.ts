import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Not } from 'typeorm';

import { TimeoutError, timeout } from '../../src/utils/timeout';
import { DB } from '../database';
import { ENV } from '../env/env';
import { workerLogger } from '../logger';

import { EventLinkAssist } from './assist/eventLinkAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { NotionAssist } from './assist/notionAssist';
import { WorkerAssist } from './assist/workerAssist';
import { WorkerContext } from './context/workerContext';
import { SyncTimeoutError } from './error/syncbot.error';
import {
    isSyncError,
    syncErrorFilter,
    unknownErrorFilter,
} from './exception/syncException';
import { WorkerResult } from './types/result';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEOUT_MS = 1000 * 60 * 60 * 12;

export class Worker {
    context: WorkerContext;

    notionAssist: NotionAssist;
    googleCalendarAssist: GoogleCalendarAssist;
    eventLinkAssist: EventLinkAssist;
    workerAssist: WorkerAssist;

    constructor(userId: number, workerId: string) {
        this.context = new WorkerContext(workerId, userId, new Date());
    }

    async run(): Promise<WorkerResult> {
        this.context.startedAt = new Date();
        this.context.user = await DB.user.findOne({
            where: {
                id: this.context.userId,
            },
        });

        try {
            await this.runSteps();
        } catch (err) {
            try {
                console.error(err);

                this.context.result.fail = true;

                if (isSyncError(err)) {
                    workerLogger.error(
                        `[${this.context.workerId}, ${this.context.user.id}] 문제가 발견되어 동기화에 실패하였습니다. (${err.code})`,
                    );
                    await syncErrorFilter(this.context, err);
                }

                workerLogger.error(
                    `[${this.context.workerId}, ${this.context.user.id}] 동기화 과정 중 알 수 없는 오류가 발생하여 동기화에 실패하였습니다. \n[알 수 없는 오류 디버그 보고서]\nname: ${err.name}\nmessage: ${err.message}\nstack: ${err.stack}`,
                );
                await unknownErrorFilter(this.context, err);
            } catch (err) {
                console.error('처리할 수 없는 에러');
                console.log(err);
            }
        }

        await DB.user.update(this.context.user.id, {
            isWork: false,
        });

        return this.context.getResult();
    }

    private async runSteps() {
        try {
            await timeout(
                (async () => {
                    await this.init();
                    await this.startSync();
                    await this.validation();
                    await this.eraseDeletedEvent();
                    await this.syncEvents();
                    await this.syncNewCalendars();
                    await this.endSync();
                })(),
                TIMEOUT_MS,
            );
        } catch (err) {
            if (err instanceof TimeoutError) {
                throw new SyncTimeoutError({
                    user: this.context.user,
                });
            } else {
                throw err;
            }
        }
    }

    // 어시스트 초기화
    private async init() {
        this.context.calendars = await DB.calendar.find({
            where: {
                userId: this.context.userId,
                status: Not('DISCONNECTED'),
            },
        });

        this.context.config = {
            timeMin:
                this.context.user.syncYear === 0
                    ? ENV.MIN_DATE
                    : dayjs(
                          `${
                              this.context.user.syncYear - 1
                          }-01-01T01:00:00+09:00`,
                      ).toISOString(),
            timeMax: ENV.MAX_DATE,
        };

        this.eventLinkAssist = new EventLinkAssist({
            context: this.context,
        });

        this.notionAssist = new NotionAssist({
            context: this.context,
            eventLinkAssist: this.eventLinkAssist,
        });

        this.googleCalendarAssist = new GoogleCalendarAssist({
            context: this.context,
            eventLinkAssist: this.eventLinkAssist,
        });

        this.workerAssist = new WorkerAssist({
            context: this.context,
            eventLinkAssist: this.eventLinkAssist,
            googleCalendarAssist: this.googleCalendarAssist,
            notionAssist: this.notionAssist,
        });
    }

    // 작업 시작
    private async startSync() {
        this.context.result.step = 'startSync';

        await this.workerAssist.startSyncUserUpdate();
    }

    // 유효성 검증
    private async validation() {
        this.context.result.step = 'validation';

        await this.workerAssist.validation();
    }

    // 제거된 페이지 삭제
    private async eraseDeletedEvent() {
        this.context.result.step = 'eraseDeletedEvent';

        await this.workerAssist.eraseDeletedNotionPage();
        await this.workerAssist.eraseDeletedEventLink();
    }

    // 동기화
    private async syncEvents() {
        this.context.result.step = 'syncEvents';

        const updatedPages = await this.notionAssist.getUpdatedPages();
        const updatedGCalEvents =
            await this.googleCalendarAssist.getUpdatedEvents();

        for (const { calendar, events } of updatedGCalEvents) {
            for (const event of events) {
                await this.notionAssist.CUDPage(event, calendar);
            }
        }

        for (const page of updatedPages) {
            await this.googleCalendarAssist.CUDEvent(page);
        }
    }

    // 새로운 캘린더 연결
    private async syncNewCalendars() {
        this.context.result.step = 'syncNewCalendar';

        const newCalendars = this.context.calendars.filter(
            (e) => e.status === 'PENDING',
        );

        for (const newCalendar of newCalendars) {
            await this.workerAssist.syncNewCalendar(newCalendar);
        }
    }

    // 작업 종료
    private async endSync() {
        this.context.result.step = 'endSync';

        await this.workerAssist.endSyncUserUpdate();
        await this.workerAssist.deleteOldErrorLogs();
    }
}
