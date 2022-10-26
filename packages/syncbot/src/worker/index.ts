import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { DB } from '../database';
import { NotionAssist } from './assist/notionAssist';
import { DatabaseAssist } from './assist/databaseAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { EventLinkAssist } from './assist/eventLinkAssest';
import { WorkerAssist } from './assist/workerAssist';

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

            console.log('동기화 성공');
        } catch (err) {
            console.error(err);
            // Error Boundary
            console.log('동기화 실패');
        }
    }

    // 어시스트 초기화
    private async init() {
        this.user = await DB.user.findOne({
            where: {
                id: this.userId,
            },
        });

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
    }

    // 작업 시작
    private async startSync() {
        this.user.workStartedAt = new Date();
        await DB.user.save(this.user);
    }

    // 유효성 검증
    private async validation() {
        await this.notionAssist.validation();
        await this.googleCalendarAssist.validation();
    }

    // 제거된 페이지 삭제
    private async eraseDeletedPage() {
        // 노션 삭제된 페이지 제거
        const notionDeletedPageIds =
            await this.notionAssist.getDeletedPageIds();
        for (const pageId of notionDeletedPageIds) {
            await this.workerAssist.eraseNotionPage(pageId);
        }

        // 삭제 예정인 이벤트 링크 제거 (캘린더 삭제시 사용)
        const deletedEventLinks =
            await this.eventLinkAssist.findDeletedEventLinks();
        for (const eventLink of deletedEventLinks) {
            await this.workerAssist.eraseEvent(eventLink);
        }
    }

    // 동기화
    private async syncEvents() {
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
    private async syncNewCalendar() {
        const calendars = this.calendars.filter(
            (e) => e.status === 'DISCONNECTED',
        );

        for (const calendar of calendars) {
            calendar.status = 'CONNECTED';
            await DB.calendar.save(calendar);
            await this.notionAssist.addCalendarProp(calendar);
            const events = await this.googleCalendarAssist.getEventByCalendar(
                calendar.googleCalendarId,
            );
            for (const event of events) {
                await this.workerAssist.addEventByGCal(event, calendar);
            }
        }
    }

    // 작업 종료
    private async endSync() {
        this.user.lastCalendarSync = new Date();
        await DB.user.save(this.user);
    }
}
