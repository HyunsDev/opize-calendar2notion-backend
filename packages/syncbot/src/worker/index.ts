import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
    CalendarEntity,
    ErrorLogEntity,
    SyncLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { DB } from '../database';
import { NotionAssist } from './assist/notionAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { EventLinkAssist } from './assist/eventLinkAssist';
import { WorkerAssist } from './assist/workerAssist';
import { SyncError } from './error/error';
import { calendar_v3 } from 'googleapis';
import { workerLogger } from '../logger';

dayjs.extend(utc);
dayjs.extend(timezone);

export class Worker {
    workerId: string;
    syncLog: SyncLogEntity;

    startedAt: Date;
    userId: number;

    user: UserEntity;
    calendars: CalendarEntity[];

    notionAssist: NotionAssist;
    googleCalendarAssist: GoogleCalendarAssist;
    eventLinkAssist: EventLinkAssist;
    workerAssist: WorkerAssist;

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
        syncLogId?: number;
    };

    constructor(userId: number, workerId: string) {
        this.userId = userId;
        this.startedAt = new Date();
        this.workerId = workerId;
    }

    async run() {
        try {
            await this.init();
            await this.startSync();
            await this.validation();
            await this.eraseDeletedEvent();
            await this.syncEvents();
            await this.syncNewCalendar();
            await this.endSync();
        } catch (err) {
            try {
                console.error(err);

                this.result.fail = true;

                this.user.lastCalendarSync = this.user.workStartedAt;
                this.user.isWork = false;
                await DB.user.save(this.user);

                if (err instanceof SyncError) {
                    workerLogger.error(
                        `[${this.workerId}, ${this.user.id}] 문제가 발견되어 동기화에 실패하였습니다. (${err.code})`,
                    );

                    if (err.finishWork === 'STOP') {
                        this.user.isConnected = false;
                        await DB.user.save(this.user);
                    }

                    const errorLog = new ErrorLogEntity();
                    errorLog.code = err.code;
                    errorLog.from = err.from;
                    errorLog.description = err.description;
                    errorLog.detail = err.detail;
                    errorLog.showUser = err.showUser;
                    errorLog.guideUrl = err.guideUrl;
                    errorLog.knownError = err.knownError;
                    errorLog.level = err.level;
                    errorLog.archive = err.archive;
                    errorLog.user = this.user;
                    errorLog.stack = err.stack;
                    errorLog.finishWork = err.finishWork;
                    errorLog.syncLog = this.syncLog;
                    await DB.errorLog.save(errorLog);
                } else {
                    workerLogger.error(
                        `[${this.workerId}, ${this.user.id}] 동기화 과정 중 알 수 없는 오류가 발생하여 동기화에 실패하였습니다. \n[알 수 없는 오류 디버그 보고서]\nname: ${err.name}\nmessage: ${err.message}\nstack: ${err.stack}`,
                    );
                    const error = new ErrorLogEntity();
                    error.code = 'unknown_error';
                    error.description = '알 수 없는 오류';
                    error.detail = err.message;
                    error.from = 'UNKNOWN';
                    error.guideUrl = '';
                    error.level = 'CRIT';
                    error.showUser = true;
                    error.stack = err.stack;
                    error.user = this.user;
                    error.finishWork = 'STOP';
                    error.syncLog = this.syncLog;
                    await DB.errorLog.save(error);
                }
            } catch (err) {
                console.log(err);
            }
        } finally {
            await this.resultPush();
            return this.result;
        }
    }

    // 어시스트 초기화
    private async init() {
        this.result = {
            step: 'init',
            fail: false,
        };

        this.user = await DB.user.findOne({
            where: {
                id: this.userId,
            },
        });

        this.startedAt = new Date();

        this.syncLog = new SyncLogEntity();
        this.syncLog.archive = false;
        this.syncLog.status = 'WORKING';
        this.syncLog.user = this.user;
        this.syncLog.detail = '';
        this.syncLog = await DB.syncLog.save(this.syncLog);
        this.result.syncLogId = this.syncLog.id;

        this.calendars = await DB.calendar.find({
            where: {
                userId: this.userId,
            },
        });

        this.eventLinkAssist = new EventLinkAssist({
            user: this.user,
        });

        this.notionAssist = new NotionAssist({
            user: this.user,
            startedAt: this.startedAt,
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
        });

        this.googleCalendarAssist = new GoogleCalendarAssist({
            user: this.user,
            startedAt: this.startedAt,
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
        });

        this.workerAssist = new WorkerAssist({
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
            googleCalendarAssist: this.googleCalendarAssist,
            notionAssist: this.notionAssist,
            startedAt: this.startedAt,
            user: this.user,
        });
    }

    // 작업 시작
    private async startSync() {
        this.result.step = 'startSync';
        this.user.workStartedAt = this.user.lastCalendarSync;
        this.user.isWork = true;
        await DB.user.save(this.user);
    }

    // 유효성 검증
    private async validation() {
        this.result.step = 'validation';
        await this.notionAssist.validation();
        await this.googleCalendarAssist.validation();
    }

    // 제거된 페이지 삭제
    private async eraseDeletedEvent() {
        this.result.step = 'eraseDeletedEvent';
        this.result.eraseDeletedEvent = {
            eventLink: -1,
            notion: -1,
        };

        // 노션 삭제된 페이지 제거
        const notionDeletedPageIds =
            await this.notionAssist.getDeletedPageIds();
        for (const pageId of notionDeletedPageIds) {
            await this.workerAssist.eraseNotionPage(pageId);
        }

        this.result.eraseDeletedEvent.notion = notionDeletedPageIds.length;
        workerLogger.debug(
            `[${this.workerId}, ${this.user.id}] ${notionDeletedPageIds.length}개의 노션 삭제된 페이지를 제거했습니다.`,
        );

        // 삭제 예정인 이벤트 링크 제거 (캘린더 삭제시 사용)
        const deletedEventLinks =
            await this.eventLinkAssist.findDeletedEventLinks();
        for (const eventLink of deletedEventLinks) {
            await this.workerAssist.eraseEvent(eventLink);
        }

        this.result.eraseDeletedEvent.eventLink = deletedEventLinks.length;
        workerLogger.debug(
            `[${this.workerId}, ${this.user.id}] ${deletedEventLinks.length}개의 삭제된 이벤트 링크를 제거했습니다.`,
        );
    }

    // 동기화
    private async syncEvents() {
        this.result.step = 'syncEvents';
        this.result.syncEvents = {
            gCal2NotionCount: -1,
            gCalCalendarCount: -1,
            notion2GCalCount: -1,
        };

        const updatedPages = await this.notionAssist.getUpdatedPages();
        const updatedGCalEvents =
            await this.googleCalendarAssist.getUpdatedEvents();

        const updatedGCalEventsLength = updatedGCalEvents.reduce(
            (pre, cur) => pre + cur.events.length,
            0,
        );

        this.result.syncEvents.gCalCalendarCount = updatedGCalEvents.length;
        this.result.syncEvents.gCal2NotionCount = updatedGCalEventsLength;
        this.result.syncEvents.notion2GCalCount = updatedPages.length;

        for (const { calendar, events } of updatedGCalEvents) {
            for (const event of events) {
                await this.notionAssist.CUDPage(event, calendar);
            }
        }

        for (const page of updatedPages) {
            await this.googleCalendarAssist.CUDEvent(page);
        }

        workerLogger.debug(
            `[${this.workerId}, ${this.user.id}] ${
                updatedGCalEvents.length
            }개의 구글 캘린더, ${updatedGCalEventsLength}개의 업데이트 된 이벤트를 동기화했습니다. (${updatedGCalEvents
                .reduce((pre, cur) => [...pre, ...cur.events], [])
                .map((e: calendar_v3.Schema$Event) => e.id)
                .join(', ')})`,
        );

        workerLogger.debug(
            `[${this.workerId}, ${this.user.id}] ${
                updatedPages.length
            }개의 업데이트된 노션 페이지를 동기화했습니다. (${updatedPages
                .map((e) => e.id)
                .join(', ')})`,
        );
    }

    // 새로운 캘린더 연결
    private async syncNewCalendar() {
        this.result.step = 'syncNewCalendar';
        this.result.syncNewCalendar = {};

        const calendars = this.calendars.filter(
            (e) => e.status === 'DISCONNECTED',
        );

        for (const calendar of calendars) {
            this.result.syncNewCalendar[`${calendar.id}`] = {
                id: calendar.id,
                gCalId: calendar.googleCalendarId,
                gCalName: calendar.googleCalendarName,
                eventCount: 0,
            };

            calendar.status = 'CONNECTED';
            await DB.calendar.save(calendar);
            await this.notionAssist.addCalendarProp(calendar);
            const events = await this.googleCalendarAssist.getEventByCalendar(
                calendar.googleCalendarId,
            );
            for (const event of events) {
                await this.workerAssist.addEventByGCal(event, calendar);
            }

            this.result.syncNewCalendar[`${calendar.id}`].eventCount =
                events.length;

            workerLogger.debug(
                `[${this.workerId}, ${this.user.id}] 새로운 캘린더 ${calendar.googleCalendarId}와 ${events.length}개의 이벤트를 추가했습니다.`,
            );
        }
    }

    // 작업 종료
    private async endSync() {
        this.result.step = 'endSync';
        this.user.lastCalendarSync = new Date();
        this.user.isWork = false;
        await DB.user.save(this.user);
        workerLogger.debug(
            `[${this.workerId}, ${this.user.id}] 작업을 완료했습니다. ${
                (new Date().getTime() - this.startedAt.getTime()) / 1000
            }s`,
        );
    }

    // 결과 전송
    private async resultPush() {
        this.result.simpleResponse = [
            this.syncLog.id,
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

        this.syncLog.status = this.result.fail ? 'FAIL' : 'SUCCESS';
        this.syncLog.workingTime =
            new Date().getTime() - this.startedAt.getTime();
        this.syncLog.detail = JSON.stringify(this.result);
        this.syncLog = await DB.syncLog.save(this.syncLog);
    }
}
