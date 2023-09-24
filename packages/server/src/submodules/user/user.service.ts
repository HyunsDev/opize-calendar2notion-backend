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
import * as dayjs from 'dayjs';
import { calendar_v3 } from 'googleapis';
import { GoogleCalendarClient } from 'src/common/api-client/googleCalendar.client';
import { getGoogleCalendarTokensByUser } from 'src/common/api-client/googleCalendarToken';
import { Not, Repository } from 'typeorm';

import { AddCalendarDto } from './dto/add-calendar.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneUserResDto } from './dto/find-one-user.res.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from './submodules/auth/auth.service';
import { OpizeAuthService } from './submodules/auth/opize.auth.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
        @InjectRepository(CalendarEntity)
        private calendarsRepository: Repository<CalendarEntity>,
        @InjectRepository(EventEntity)
        private eventsRepository: Repository<EventEntity>,
        private authService: AuthService,
        private opizeAuthService: OpizeAuthService,
    ) {}

    // 유저 정보를 생성합니다.
    async post(createUserDto: CreateUserDto) {
        const token = await this.opizeAuthService.getUserToken(
            createUserDto.token,
            createUserDto.redirectUrl,
        );
        const opizeUser = await this.opizeAuthService.getUserByOpize(token);

        let user = await this.usersRepository.findOne({
            where: {
                opizeId: opizeUser.id,
            },
        });

        if (!user) {
            user = new UserEntity();
            user.syncYear = dayjs().year();
        }

        user.name = opizeUser.name;
        user.email = opizeUser.email;
        user.imageUrl = opizeUser.imageUrl;
        user.opizeId = opizeUser.id;
        user.opizeAccessToken = token;
        user = await this.usersRepository.save(user);

        const userJWT = this.authService.getUserJWT(user.id);
        return {
            token: userJWT,
        };
    }

    async findOne(userEntity: UserEntity) {
        const user = await this.usersRepository.findOne({
            where: {
                id: userEntity.id,
            },
            relations: ['calendars', 'notionWorkspace', 'paymentLogs'],
        });

        user.paymentLogs = [...user.paymentLogs].reverse();

        if (user.status !== 'FINISHED') {
            return new FindOneUserResDto(user, []);
        }

        const tokens = getGoogleCalendarTokensByUser(userEntity);

        const googleClient = new GoogleCalendarClient(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.callbackUrl,
        );
        const googleCalendarsRes = await googleClient.getCalendars();
        const googleCalendars = googleCalendarsRes.data.items.map((e) => ({
            id: e.id,
            summary: e.summary,
            primary: e.primary,
            backgroundColor: e.backgroundColor,
            foregroundColor: e.foregroundColor,
            accessRole: e.accessRole as
                | 'none'
                | 'freeBusyReader'
                | 'reader'
                | 'writer'
                | 'owner',
        }));

        user.calendars = user.calendars.filter(
            (e) => e.status !== 'DISCONNECTED',
        );

        return new FindOneUserResDto(user, googleCalendars);
    }

    async update(user: UserEntity, updateUserDto: UpdateUserDto) {
        if (updateUserDto.imageUrl) user.imageUrl = updateUserDto.imageUrl;
        if (updateUserDto.isConnected !== undefined)
            user.isConnected = updateUserDto.isConnected;
        if (updateUserDto.isWork !== undefined)
            user.isWork = updateUserDto.isWork;
        if (updateUserDto.name) user.name = updateUserDto.name;
        if (updateUserDto.userTimeZone)
            user.userTimeZone = updateUserDto.userTimeZone;

        await this.usersRepository.save(user);
        return;
    }

    async remove(user: UserEntity) {
        try {
            const deletePrefix = `deleted_${new Date().getTime()}_`;

            await this.usersRepository.update(
                {
                    id: user.id,
                },
                {
                    isConnected: false,
                    email: deletePrefix + user.email,
                    googleEmail: deletePrefix + user.googleEmail,
                    notionDatabaseId: deletePrefix + user.notionDatabaseId,
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    googleId: null,
                    notionAccessToken: null,
                    opizeAccessToken: null,
                },
            );

            await this.eventsRepository.delete({
                userId: user.id,
            });
            await this.calendarsRepository.delete({
                userId: user.id,
            });

            await this.usersRepository.softRemove(user);
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException();
        }
    }

    async reset(user: UserEntity) {
        try {
            await this.usersRepository.update(
                {
                    id: user.id,
                },
                {
                    isConnected: false,
                    notionDatabaseId: null,
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    googleId: null,
                    notionAccessToken: null,
                    lastCalendarSync: null,
                    notionBotId: null,
                    notionProps: null,
                    workStartedAt: null,
                    notionWorkspace: null,
                    isWork: false,
                    status: 'FIRST',
                },
            );

            await this.eventsRepository.delete({
                userId: user.id,
            });
            await this.calendarsRepository.delete({
                userId: user.id,
            });

            return {
                success: true,
            };
        } catch (err) {
            console.error(err);
            throw new InternalServerErrorException();
        }
    }
}
