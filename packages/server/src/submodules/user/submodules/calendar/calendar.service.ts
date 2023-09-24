import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';
import { calendar_v3 } from 'googleapis';
import { GoogleCalendarClient } from 'src/common/api-client/googleCalendar.client';
import { getGoogleCalendarTokensByUser } from 'src/common/api-client/googleCalendarToken';
import { Not, Repository } from 'typeorm';

import { AddCalendarDto } from '../../dto/add-calendar.dto';

@Injectable()
export class UserCalendarService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(EventEntity)
        private eventsRepository: Repository<EventEntity>,
    ) {}

    async addCalendar(user: UserEntity, addCalendarDto: AddCalendarDto) {
        const tokens = getGoogleCalendarTokensByUser(user);

        const googleClient = new GoogleCalendarClient(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.callbackUrl,
        );

        let googleCalendar: calendar_v3.Schema$CalendarListEntry;
        try {
            googleCalendar = (
                await googleClient.getCalendar(addCalendarDto.googleCalendarId)
            ).data;
        } catch (err) {
            if (err.code === 404)
                throw new NotFoundException({
                    code: 'calendar_not_found',
                });

            console.error(err);
            throw new InternalServerErrorException({
                code: `google_calendar_api_error_${err.code}`,
            });
        }

        // 동일한 이름의 캘린더 거부
        const sameNameCalendar = await this.calendarsRepository.findOne({
            where: [
                {
                    userId: user.id,
                    googleCalendarName: googleCalendar.summary,
                    status: 'CONNECTED',
                },
                {
                    userId: user.id,
                    googleCalendarName: googleCalendar.summary,
                    status: 'PENDING',
                },
            ],
        });

        if (sameNameCalendar) {
            throw new BadRequestException({
                code: 'same_name_calendar_exist',
            });
        }

        const oldCalendar = await this.calendarsRepository.findOne({
            where: {
                userId: user.id,
                googleCalendarId: addCalendarDto.googleCalendarId,
            },
        });

        if (
            oldCalendar &&
            (oldCalendar.status === 'CONNECTED' ||
                oldCalendar.status === 'PENDING')
        ) {
            throw new BadRequestException({
                code: 'calendar_already_exist',
            });
        }

        if (
            !oldCalendar ||
            (oldCalendar && oldCalendar.status === 'DISCONNECTED')
        ) {
            const calendar = CalendarEntity.create({
                accessRole:
                    googleCalendar.accessRole as CalendarEntity['accessRole'],
                googleCalendarId: googleCalendar.id,
                googleCalendarName: googleCalendar.summary,
                user: user,
            });

            await this.calendarsRepository.save(calendar);
        } else {
            const calendar = oldCalendar;
            calendar.accessRole = googleCalendar.accessRole as
                | 'none'
                | 'freeBusyReader'
                | 'reader'
                | 'writer'
                | 'owner';
            calendar.googleCalendarId = googleCalendar.id;
            calendar.googleCalendarName = googleCalendar.summary;
            calendar.status = 'PENDING';
            calendar.user = user;
            await this.calendarsRepository.save(calendar);
        }

        return;
    }

    async removeCalendar(user: UserEntity, calendarId: number) {
        const calendar = await this.calendarsRepository.findOne({
            where: {
                id: calendarId,
                userId: user.id,
                status: Not('DISCONNECTED'),
            },
        });

        if (!calendar)
            throw new NotFoundException({
                code: 'calendar_not_found',
            });

        if (user.isWork) {
            return {
                code: 'user_is_work',
            };
        }

        await this.eventsRepository.update(
            {
                calendar: calendar,
                userId: user.id,
            },
            {
                willRemove: true,
            },
        );

        calendar.status = 'DISCONNECTED';
        await this.calendarsRepository.save(calendar);

        return;
    }
}
