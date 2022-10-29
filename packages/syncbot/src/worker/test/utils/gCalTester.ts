import { CalendarEntity, UserEntity } from '@opize/calendar2notion-model';
import { google, calendar_v3 } from 'googleapis';
import { transDate } from '../../utils/dateUtils';
import { TestEventObject, TestPageObject } from '../type/testObject';

export class GCalTester {
    client: calendar_v3.Calendar;
    user: UserEntity;
    calendar: CalendarEntity;

    public init({
        user,
        calendar,
    }: {
        user: UserEntity;
        calendar: CalendarEntity;
    }) {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_PASSWORD,
            process.env.GOOGLE_CALLBACK,
        );
        oAuth2Client.setCredentials({
            refresh_token: process.env.TEST_USER_GOOGLE_REFRESH_TOKEN,
            access_token: process.env.TEST_USER_GOOGLE_ACCESS_TOKEN,
        });
        this.client = google.calendar({
            version: 'v3',
            auth: oAuth2Client,
        });
        this.user = user;
        this.calendar = calendar;
    }

    private getTestObject(
        event: calendar_v3.Schema$Event,
        calendar: CalendarEntity,
    ): TestEventObject {
        return {
            title: event.summary,
            date: {
                start: event.start,
                end: event.end,
            },
            calendar: calendar,
            description: event.description,
            from: 'googleCalendar',
            location: event.location,
            event: event,
        };
    }

    public async createEvent(summary: string) {
        const res = await this.client.events.insert({
            calendarId: this.calendar.googleCalendarId,
            requestBody: {
                start: {
                    dateTime: '2022-10-27T01:00:00',
                    timeZone: 'Asia/Seoul',
                },
                end: {
                    dateTime: '2022-10-28T01:00:00',
                    timeZone: 'Asia/Seoul',
                },
                summary: summary,
                description: 'description',
                location: 'location',
            },
        });
        return this.getTestObject(res.data, this.calendar);
    }

    public async updateEvent(testEventObject: TestEventObject) {
        await this.client.events.update({
            calendarId: this.calendar.googleCalendarId,
            eventId: testEventObject.event.id,
            requestBody: {
                start: {
                    dateTime: '2022-10-28T01:00:00',
                    timeZone: 'Asia/Seoul',
                },
                end: {
                    dateTime: '2022-10-29T01:00:00',
                    timeZone: 'Asia/Seoul',
                },
                summary: `edited_${testEventObject.title}`,
                description: 'edited_description',
                location: 'edited_location',
            },
        });
        const event = await this.getEvent(testEventObject.event.id);
        return this.getTestObject(event, this.calendar);
    }

    public async deleteEvent(testEventObject: TestEventObject) {
        await this.client.events.delete({
            calendarId: this.calendar.googleCalendarId,
            eventId: testEventObject.event.id,
        });
    }

    public async destroyEvent(testEventObject: TestEventObject) {
        await this.client.events.delete({
            calendarId: testEventObject.calendar.googleCalendarId,
            eventId: testEventObject.event.id,
        });
    }

    public async getEvent(eventId: string) {
        const res = await this.client.events.get({
            calendarId: this.calendar.googleCalendarId,
            eventId: eventId,
        });
        return res.data;
    }

    public checkEvent(
        event: calendar_v3.Schema$Event,
        testPageObject: TestPageObject,
    ) {
        const errors = {
            title: false,
            date: false,
            description: false,
            location: false,
            calendar: false,
        };

        // title
        if (event.summary !== testPageObject.title) {
            console.error(
                `title의 값이 다릅니다. ${event.summary}, ${testPageObject.title}`,
            );
            errors.title = true;
        }

        // date
        // const trancedDate = transDate.eventToGcal(testPageObject.date);
        // if (
        //     new Date(new Date(event.start.dateTime).toISOString()).getTime() !==
        //     new Date(trancedDate.start.dateTime).getTime()
        // ) {
        //     console.error(
        //         `start date가 다릅니다. ${event.start.dateTime}, ${trancedDate.start.dateTime}`,
        //     );
        //     errors.date = true;
        // }
        // if (
        //     new Date(new Date(event.end.dateTime).toISOString()).getTime() !==
        //     new Date(trancedDate.end.dateTime).getTime()
        // ) {
        //     console.error(
        //         `end date가 다릅니다. ${event.end.dateTime}, ${trancedDate.end.dateTime}`,
        //     );
        //     errors.date = true;
        // }

        // description
        if (event.description !== testPageObject.description) {
            console.error(
                `description이 다릅니다. ${event.description}, ${testPageObject.description}`,
            );
            errors.description = true;
        }

        // location
        if (event.location !== testPageObject.location) {
            console.error(
                `location이 다릅니다. ${event.location}, ${testPageObject.location}`,
            );
            errors.location = true;
        }

        return errors;
    }
}
