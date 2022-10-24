import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { DB } from '../database';
import { NotionAssist } from './assist/notionAssist';
import { DatabaseAssist } from './assist/databaseAssist';
import { GoogleCalendarAssist } from './assist/googleCalendarAssist';
import { EventLinkAssist } from './assist/eventLinkAssest';

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

    constructor(userId: number) {
        this.userId = userId;
        this.startedAt = new Date();
    }

    async run() {
        try {
            await this.init();
            await this.validation();
            console.log('동기화 성공');
        } catch (err) {
            // console.error(err);
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

        this.eventLinkAssist = new EventLinkAssist();

        this.databaseAssist = new DatabaseAssist();

        this.notionAssist = new NotionAssist({
            user: this.user,
            startedAt: this.startedAt,
            calendars: this.calendars,
            eventLinkAssist: this.eventLinkAssist,
            databaseAssist: this.databaseAssist,
        });

        this.googleCalendarAssist = new GoogleCalendarAssist();
    }

    // 유효성 검증
    private async validation() {
        await this.notionAssist.validation();
    }
}
