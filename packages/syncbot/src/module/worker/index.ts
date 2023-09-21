import { DB } from '@/database';
import {
    EventLinkAssist,
    GoogleCalendarAssist,
    NotionAssist,
    WorkerAssist,
} from './assist';
import { WorkContext } from './context/work.context';
import { WorkerResult } from './types/result';
import { Not } from 'typeorm';
import {
    isSyncError,
    syncErrorFilter,
    unknownErrorFilter,
} from './exception/syncException';
import { workerLogger } from '@/logger/winston';
import { TimeoutError, timeout } from '@/utils';
import { SyncTimeoutError } from './error/syncbot.error';
import { context } from '../context';

export class Worker {
    context: WorkContext;

    notionAssist: NotionAssist;
    googleCalendarAssist: GoogleCalendarAssist;
    eventLinkAssist: EventLinkAssist;
    workerAssist: WorkerAssist;

    constructor(userId: number, workerId: string) {
        this.context = new WorkContext(workerId, userId, new Date());
    }

    async run(): Promise<WorkerResult> {
        this.context.startedAt = new Date();
        this.context.user = await DB.user.findOne({
            where: {
                id: this.context.userId,
            },
        });

        try {
            await this.runStepsWithTimeout();
        } catch (err) {
            try {
                this.context.result.fail = true;

                if (isSyncError(err)) {
                    this.context.result.failReason = err.code;
                    workerLogger.error(
                        `[${this.context.workerId}:${this.context.user.id}] 문제가 발견되어 동기화에 실패하였습니다. (${err.code})`,
                    );
                    await syncErrorFilter(this.context, err);
                } else {
                    workerLogger.error(
                        `[${this.context.workerId}:${this.context.user.id}] 동기화 과정 중 알 수 없는 오류가 발생하여 동기화에 실패하였습니다. \n[알 수 없는 오류 디버그 보고서]\nname: ${err.name}\nmessage: ${err.message}\nstack: ${err.stack}`,
                    );
                    await unknownErrorFilter(this.context, err);
                }
            } catch (err) {
                workerLogger.error(
                    `[${this.context.workerId}:${this.context.user.id}] **에러 필터 실패** 동기화 과정 중 알 수 없는 오류가 발생하여 동기화에 실패하였습니다. \n[알 수 없는 오류 디버그 보고서]\nname: ${err.name}\nmessage: ${err.message}\nstack: ${err.stack}`,
                );
                console.error('처리할 수 없는 에러');
                console.log(err);
            }
        }

        await DB.user.update(this.context.user.id, {
            isWork: false,
        });

        const result = this.context.getResult();
        return result;
    }

    private async runStepsWithTimeout() {
        try {
            await timeout(this.runSteps(), context.syncBot.timeout);
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

    private async runSteps() {
        await this.init();
        await this.startSync();
        await this.validation();

        if (this.context.user.lastCalendarSync) {
            await this.eraseDeletedEvent();
            await this.syncEvents();
            await this.syncNewCalendars();
        } else {
            await this.initAccount();
        }

        await this.endSync();
    }

    private async init() {
        this.context.startedAt = new Date();
        this.context.user = await this.getTargetUser();
        this.context.calendars = await this.getUserCalendar();
        this.context.config = this.context.getInitConfig();

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

    // 계정 초기 세팅
    private async initAccount() {
        this.context.result.step = 'initAccount';

        const pages = await this.notionAssist.getPages();

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

    private async getTargetUser() {
        return await DB.user.findOne({
            where: {
                id: this.context.userId,
            },
        });
    }

    private async getUserCalendar() {
        return await DB.calendar.find({
            where: {
                userId: this.context.userId,
                status: Not('DISCONNECTED'),
            },
        });
    }
}
