import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
    CalendarEntity,
    ErrorLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { DB } from '../database';
import { NotionAssist } from './assist/notionAssist';
import { DatabaseAssist } from './assist/databaseAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { EventLinkAssist } from './assist/eventLinkAssist';
import { WorkerAssist } from './assist/workerAssist';
import { syncLogger } from './logger';
import { SyncError } from './error/error';
import { calendar_v3 } from 'googleapis';

dayjs.extend(utc);
dayjs.extend(timezone);

export class Worker {
    startedAt: Date;
    userId: number;

    user: UserEntity;
    calendars: CalendarEntity[];

    notionAssist: NotionAssist;
    googleCalendarAssist: GoogleCalendarAssist;
    databaseAssist: DatabaseAssist;
    eventLinkAssist: EventLinkAssist;
    workerAssist: WorkerAssist;

    constructor(userId: number) {
        this.userId = userId;
        this.startedAt = new Date();
    }

    async run() {
        try {
            await this.init();
            await this.startSync();
            await this.validation();
            await this.eraseDeletedPage();
            await this.syncEvents();
            await this.syncNewCalendar();
            await this.endSync();
            return true;
        } catch (err) {
            this.user.lastCalendarSync = new Date();
            this.user.isWork = false;
            await DB.user.save(this.user);

            if (err instanceof SyncError) {
                if (err.isReported) {
                    syncLogger.write(
                        'SYNCBOT',
                        `동기화 과정 중 문제가 발견되어 동기화에 실패하였습니다. (${err.from}, ${err.code})`,
                        'error',
                    );
                } else {
                    syncLogger.write(
                        'SYNCBOT',
                        `동기화 과정 중 예상하지 못한 오류가 발생하여 동기화에 실패하였습니다.`,
                        'crit',
                    );
                }
            } else {
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
                await DB.errorLog.save(error);

                syncLogger.write(
                    'SYNCBOT',
                    `동기화 과정 중 알 수 없는 오류가 발생하여 동기화에 실패하였습니다.`,
                    'crit',
                );
                syncLogger.write(
                    'SYNCBOT',
                    `[알 수 없는 오류 디버그 보고서]\n메세지: ${err.message}\n스택: ${err.stack}`,
                    'debug',
                );
            }

            await syncLogger.push();
            return false;
        }
    }

    // 어시스트 초기화
    private async init() {
        this.user = await DB.user.findOne({
            where: {
                id: this.userId,
            },
        });

        await syncLogger.init(this.user);

        this.calendars = await DB.calendar.find({
            where: {
                userId: this.userId,
            },
        });

        this.eventLinkAssist = new EventLinkAssist({
            user: this.user,
        });

        this.databaseAssist = new DatabaseAssist();

        this.notionAssist = new NotionAssist({
            user: this.user,
            startedAt: this.startedAt,
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
            databaseAssist: this.databaseAssist,
        });

        this.googleCalendarAssist = new GoogleCalendarAssist({
            user: this.user,
            startedAt: this.startedAt,
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
            databaseAssist: this.databaseAssist,
        });

        this.workerAssist = new WorkerAssist({
            calendars: this.calendars,
            databaseAssist: this.databaseAssist,
            eventLinkAssist: this.eventLinkAssist,
            googleCalendarAssist: this.googleCalendarAssist,
            notionAssist: this.notionAssist,
            startedAt: this.startedAt,
            user: this.user,
        });

        syncLogger.write('SYNCBOT', '동기화봇 초기화 완료');
    }

    // 작업 시작
    private async startSync() {
        this.user.workStartedAt = new Date();
        this.user.isWork = true;
        await DB.user.save(this.user);
    }

    // 유효성 검증
    private async validation() {
        await this.notionAssist.validation();
        await this.googleCalendarAssist.validation();
        syncLogger.write('SYNCBOT', '유효성 검증 완료');
    }

    // 제거된 페이지 삭제
    private async eraseDeletedPage() {
        // 노션 삭제된 페이지 제거
        const notionDeletedPageIds =
            await this.notionAssist.getDeletedPageIds();
        for (const pageId of notionDeletedPageIds) {
            await this.workerAssist.eraseNotionPage(pageId);
        }

        if (notionDeletedPageIds) {
            syncLogger.write(
                'SYNCBOT',
                `${notionDeletedPageIds.length}개의 노션 삭제된 페이지를 제거했습니다.`,
            );
        } else {
            syncLogger.write('SYNCBOT', '노션 삭제된 페이지가 없습니다.');
        }

        // 삭제 예정인 이벤트 링크 제거 (캘린더 삭제시 사용)
        const deletedEventLinks =
            await this.eventLinkAssist.findDeletedEventLinks();
        for (const eventLink of deletedEventLinks) {
            await this.workerAssist.eraseEvent(eventLink);
        }

        if (notionDeletedPageIds) {
            syncLogger.write(
                'SYNCBOT',
                `${notionDeletedPageIds.length}개의 삭제 예정인 이벤트 링크를 제거했습니다.`,
            );
        } else {
            syncLogger.write('SYNCBOT', '삭제 예정인 이벤트 링크가 없습니다.');
        }
    }

    // 동기화
    private async syncEvents() {
        const updatedPages = await this.notionAssist.getUpdatedPages();
        const updatedGCalEvents =
            await this.googleCalendarAssist.getUpdatedEvents();

        const updatedGCalEventsLength = updatedGCalEvents.reduce(
            (pre, cur) => pre + cur.events.length,
            0,
        );
        syncLogger.write(
            'SYNCBOT',
            `${updatedGCalEvents.length}개의 구글 캘린더, ${updatedGCalEventsLength}개의 업데이트 된 이벤트를 찾았습니다.`,
        );
        updatedGCalEventsLength !== 0 &&
            syncLogger.write(
                'SYNCBOT',
                updatedGCalEvents
                    .reduce((pre, cur) => [...pre, ...cur.events], [])
                    .map(
                        (e: calendar_v3.Schema$Event) =>
                            `Updated GCal Event: ${e.summary} (${e.id})`,
                    )
                    .join('\n'),
                'debug',
            );
        syncLogger.write(
            'SYNCBOT',
            `${updatedPages.length}개의 업데이트된 노션 페이지를 찾았습니다.`,
        );
        updatedPages.length !== 0 &&
            syncLogger.write(
                'SYNCBOT',
                updatedPages
                    .map(
                        (e) =>
                            `Updated Notion Page: ${
                                (e.properties.title as any)?.title?.[0]
                                    ?.plain_text || ''
                            } (${e.id})`,
                    )
                    .join('\n'),
                'debug',
            );

        for (const { calendar, events } of updatedGCalEvents) {
            for (const event of events) {
                await this.notionAssist.CUDPage(event, calendar);
            }
        }

        syncLogger.write(
            'SYNCBOT',
            '업데이트 된 구글 캘린더 이벤트를 노션에 모두 업데이트 했습니다.',
        );

        for (const page of updatedPages) {
            await this.googleCalendarAssist.CUDEvent(page);
        }
        syncLogger.write(
            'SYNCBOT',
            '업데이트된 노션 페이지를 구글 캘린더에 모두 업데이트 했습니다.',
        );
    }

    // 새로운 캘린더 연결
    private async syncNewCalendar() {
        const calendars = this.calendars.filter(
            (e) => e.status === 'DISCONNECTED',
        );

        for (const calendar of calendars) {
            syncLogger.write(
                'SYNCBOT',
                `새로운 캘린더(${calendar.googleCalendarName})를 추가합니다.`,
            );

            calendar.status = 'CONNECTED';
            await DB.calendar.save(calendar);
            await this.notionAssist.addCalendarProp(calendar);
            const events = await this.googleCalendarAssist.getEventByCalendar(
                calendar.googleCalendarId,
            );
            for (const event of events) {
                await this.workerAssist.addEventByGCal(event, calendar);
            }

            syncLogger.write(
                'SYNCBOT',
                `새로운 캘린더(${calendar.googleCalendarId})를 추가했습니다. ${events.length}개의 이벤트를 추가했습니다.`,
            );
        }
    }

    // 작업 종료
    private async endSync() {
        this.user.lastCalendarSync = new Date();
        this.user.isWork = false;
        await DB.user.save(this.user);
        syncLogger.write(
            'SYNCBOT',
            `모든 작업을 완료했습니다. ${
                (new Date().getTime() - this.startedAt.getTime()) / 1000
            }s`,
            'info',
        );
        await syncLogger.push();
    }
}
