import './testenv';
import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { NotionTester } from './utils/notionTester';
import { DB, AppDataSource } from '../../database';
import { Worker } from '..';
import { GCalTester } from './utils/gCalTester';
import { v4 as uuidv4 } from 'uuid';
import { TestEventObject, TestPageObject } from './type/testObject';
import { sleep } from '../../utils';

describe('Worker Test', () => {
    let user: UserEntity;
    let calendar: CalendarEntity;
    const notionTester = new NotionTester();
    const gCalTester = new GCalTester();

    // 마무리 작업을 위해 작업 중 생성된 이벤트를 임시로 보관하는 변수
    const testEventObjects: TestEventObject[] = [];
    const testPageObjects: TestPageObject[] = [];

    beforeEach(() => {
        jest.setTimeout(1000 * 60 * 10);
    });

    beforeAll(async () => {
        // 노션 데이터베이스 생성
        await AppDataSource.initialize();

        const notionDatabase = await notionTester.createTestDatabase(
            '노션 자동화 테스트',
        );

        const oldUser = await DB.user.findOne({
            where: {
                email: 'hyunsdev.test@gmail.com',
            },
        });
        if (oldUser) {
            await DB.event.delete({
                userId: oldUser.id,
            });
            await DB.calendar.delete({
                userId: oldUser.id,
            });
            await DB.syncLog.delete({
                userId: oldUser.id,
            });
            await DB.errorLog.delete({
                userId: oldUser.id,
            });
            await DB.user.delete({
                email: 'hyunsdev.test@gmail.com',
            });
        }

        user = new UserEntity();
        user.name = process.env.TEST_USER_NAME;
        user.email = process.env.TEST_USER_EMAIL;
        user.imageUrl = '';
        user.googleId = process.env.TEST_USER_GOOGLE_ID;
        user.googleAccessToken = process.env.TEST_USER_GOOGLE_ACCESS_TOKEN;
        user.googleRefreshToken = process.env.TEST_USER_GOOGLE_REFRESH_TOKEN;
        user.notionAccessToken = process.env.TEST_USER_NOTION_ACCESS_TOKEN;
        user.notionBotId = process.env.TEST_USER_NOTION_BOT_ID;
        user.notionDatabaseId = notionDatabase.id;
        user.status = 'FINISHED';
        user.isConnected = true;
        user.userPlan = 'PRO';
        user.userTimeZone = 'Asia/Seoul';
        user.notionProps = JSON.stringify({
            title: notionDatabase.properties.title.id,
            calendar: notionDatabase.properties.calendar.id,
            delete: notionDatabase.properties.delete.id,
            date: notionDatabase.properties.date.id,
            description: notionDatabase.properties.description.id,
            location: notionDatabase.properties.location.id,
        });
        user.isWork = false;
        user = await DB.user.save(user);

        calendar = new CalendarEntity();
        calendar.accessRole = 'owner';
        calendar.googleCalendarId =
            process.env.TEST_USER_GOOGLE_CALENDAR_CALENDAR_ID;
        calendar.googleCalendarName =
            process.env.TEST_USER_GOOGLE_CALENDAR_CALENDAR_NAME;
        calendar.status = 'DISCONNECTED';
        calendar.user = user;
        calendar = await DB.calendar.save(calendar);

        gCalTester.init({
            user,
            calendar,
        });
        notionTester.init({
            user,
            calendar,
        });
    });

    afterAll(async () => {
        // await notionTester.destroyTestDatabase(user.notionDatabaseId);
        await AppDataSource.destroy();
    });

    beforeEach(async () => {
        jest.setTimeout(300000);

        user = await DB.user.findOne({
            where: {
                id: user.id,
            },
        });
        calendar = await DB.calendar.findOne({
            where: {
                id: calendar.id,
            },
        });
        gCalTester.init({
            user,
            calendar,
        });
        notionTester.init({
            user,
            calendar,
        });
    });

    test('첫 동기화', async () => {
        const title = 'init Event';

        // 새로운 구글 이벤트 추가
        const testEventObject = await gCalTester.createEvent(title);
        testEventObjects.push(testEventObject);

        await sleep(1000 * 60);

        // 워커 작동
        const worker = new Worker(user.id, 'test: init');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 워커 검증
        const eventLink = await DB.event.findOne({
            where: {
                googleCalendarEventId: testEventObject.event.id,
            },
        });
        expect(eventLink).toBeTruthy();
        const page = await notionTester.getPage(eventLink.notionPageId);
        const notionCheckErrors = notionTester.checkPage(page, testEventObject);

        expect(notionCheckErrors.title).toBe(false);
        expect(notionCheckErrors.date).toBe(false);
        expect(notionCheckErrors.description).toBe(false);
        expect(notionCheckErrors.location).toBe(false);
        expect(notionCheckErrors.calendar).toBe(false);
    });

    test('[구글 캘린더 -> 노션] 페이지 추가', async () => {
        const title = 'GCal2Notion addPage';

        await sleep(1000 * 60);

        // 이벤트 추가
        const testEventObject = await gCalTester.createEvent(title);
        testEventObjects.push(testEventObject);

        // 워커 작동
        const worker = new Worker(user.id, 'test: g2n addPage');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 워커 검증
        const eventLink = await DB.event.findOne({
            where: {
                googleCalendarEventId: testEventObject.event.id,
            },
        });

        const page = await notionTester.getPage(eventLink.notionPageId);
        expect(page).toBeTruthy();
        const notionCheckErrors = notionTester.checkPage(page, testEventObject);

        expect(notionCheckErrors.title).toBe(false);
        expect(notionCheckErrors.date).toBe(false);
        expect(notionCheckErrors.description).toBe(false);
        expect(notionCheckErrors.location).toBe(false);
        // expect(notionCheckErrors.calendar).toBe(false);
    });

    test('[노션 -> 구글 캘린더] 이벤트 추가', async () => {
        const title = 'Notion2GCal addEvent';

        // 페이지 추가
        const testPageObject = await notionTester.createPage(title);
        testPageObjects.push(testPageObject);
        await sleep(1000 * 60);

        // 워커 작동
        const worker = new Worker(user.id, 'test: n2g addEvent');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 검증
        const eventLink = await DB.event.findOne({
            where: {
                notionPageId: testPageObject.page.id,
            },
        });

        expect(eventLink).toBeTruthy();
        const event = await gCalTester.getEvent(
            eventLink.googleCalendarEventId,
        );

        const gCalCheckErrors = gCalTester.checkEvent(event, testPageObject);

        expect(gCalCheckErrors.title).toBe(false);
        // expect(gCalCheckErrors.date).toBe(false);
        expect(gCalCheckErrors.description).toBe(false);
        expect(gCalCheckErrors.location).toBe(false);
        expect(gCalCheckErrors.calendar).toBe(false);
    });

    test('[노션 -> 구글 캘린더] event 업데이트', async () => {
        await sleep(1000 * 60);
        const oldTestPageObject = testPageObjects.at(-1);

        // 페이지 추가
        const testPageObject = await notionTester.editPage(oldTestPageObject);
        await sleep(1000 * 60);

        // 워커 작동
        const worker = new Worker(user.id, 'test: n2g eventUpdate');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 검증
        const eventLink = await DB.event.findOne({
            where: {
                notionPageId: testPageObject.page.id,
            },
        });
        expect(eventLink).toBeTruthy();
        const event = await gCalTester.getEvent(
            eventLink.googleCalendarEventId,
        );
        const gCalCheckErrors = gCalTester.checkEvent(event, testPageObject);

        expect(gCalCheckErrors.title).toBe(false);
        // expect(gCalCheckErrors.date).toBe(false);
        expect(gCalCheckErrors.description).toBe(false);
        expect(gCalCheckErrors.location).toBe(false);
        expect(gCalCheckErrors.calendar).toBe(false);
    });

    test('[구글 캘린더 -> 노션] 페이지 업데이트', async () => {
        // 이벤트 추가
        const oldTestEventObject =
            testEventObjects[testEventObjects.length - 1];
        const testEventObject = await gCalTester.updateEvent(
            oldTestEventObject,
        );

        await sleep(1000 * 60);

        // 워커 작동
        const worker = new Worker(user.id, 'test: g2n pageUpdate');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 워커 검증
        const eventLink = await DB.event.findOne({
            where: {
                googleCalendarEventId: testEventObject.event.id,
            },
        });
        expect(eventLink).toBeTruthy();
        const page = await notionTester.getPage(eventLink.notionPageId);
        const notionCheckErrors = notionTester.checkPage(page, testEventObject);

        expect(notionCheckErrors.title).toBe(false);
        expect(notionCheckErrors.date).toBe(false);
        expect(notionCheckErrors.description).toBe(false);
        expect(notionCheckErrors.location).toBe(false);
        expect(notionCheckErrors.calendar).toBe(false);
    });

    test('[노션 -> 구글 캘린더] 이벤트 삭제', async () => {
        const testPageObject = testPageObjects[testPageObjects.length - 1];

        // 페이지 삭제
        await notionTester.deletePage(testPageObject);
        await sleep(1000 * 60);

        const oldEventLink = await DB.event.findOne({
            where: {
                notionPageId: testPageObject.page.id,
            },
        });

        // 워커 작동
        const worker = new Worker(user.id, 'test: n2g deleteEvent');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 검증
        const eventLink = await DB.event.findOne({
            where: {
                notionPageId: testPageObject.page.id,
            },
        });
        expect(eventLink).toBeFalsy();

        const event = await gCalTester.getEvent(
            oldEventLink.googleCalendarEventId,
        );

        expect(event.status).toBe('cancelled');
    });

    test('[구글 캘린더 -> 노션] 페이지 삭제', async () => {
        // 이벤트 추가
        const testEventObject = testEventObjects[testEventObjects.length - 1];

        await gCalTester.deleteEvent(testEventObject);

        await sleep(1000 * 60);

        // 워커 작동
        const worker = new Worker(user.id, 'test: g2n delete page');
        const res = await worker.run();
        expect(res.fail).toBe(false);

        await sleep(1000 * 10);

        // 워커 검증
        const eventLink = await DB.event.findOne({
            where: {
                googleCalendarEventId: testEventObject.event.id,
            },
        });
        expect(eventLink).toBeFalsy();
    });
});
