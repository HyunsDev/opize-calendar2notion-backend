import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { calendar_v3 } from 'googleapis';
import { AddCalendarDto } from './dto/add-calendar.dto';
import { AuthService } from './submodules/auth/auth.service';
import { OpizeAuthService } from './submodules/auth/opize.auth.service';
import { GoogleCalendarClient } from 'src/common/api-client/googleCalendar.client';
import { getGoogleCalendarTokensByUser } from 'src/common/api-client/googleCalendarToken';

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
        );
        const opizeUser = await this.opizeAuthService.getUserByOpize(token);

        let user =
            (await this.usersRepository.findOne({
                where: {
                    opizeId: opizeUser.id,
                },
            })) || new UserEntity();

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

    async findOne(user: UserEntity) {
        if (user.status !== 'FINISHED') {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                imageUrl: user.imageUrl,
                opizeId: user.opizeId,
                googleEmail: user.googleEmail,
                notionDatabaseId: user.notionDatabaseId,
                lastCalendarSync: user.lastCalendarSync,
                lastSyncStatus: user.lastSyncStatus,
                status: user.status,
                isConnected: user.isConnected,
                userPlan: user.userPlan,
                userTimeZone: user.userTimeZone,
                notionProps: JSON.parse(user.notionProps || '{}'),
                isWork: user.isWork,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
                calendars: [],
                allCalendars: [],
            };
        }

        const calendars = await this.calendarsRepository.find({
            where: {
                userId: user.id,
                status: Not('DISCONNECTED'),
            },
        });

        const tokens = getGoogleCalendarTokensByUser(user);

        const googleClient = new GoogleCalendarClient(
            tokens.accessToken,
            tokens.refreshToken,
            tokens.callbackUrl,
        );
        const googleCalendarsRes = await googleClient.getCalendars();
        const googleCalendars = googleCalendarsRes.data.items.map((e) => {
            return {
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
            };
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl,
            opizeId: user.opizeId,
            googleEmail: user.googleEmail,
            notionDatabaseId: user.notionDatabaseId,
            lastCalendarSync: user.lastCalendarSync,
            lastSyncStatus: user.lastSyncStatus,
            status: user.status,
            isConnected: user.isConnected,
            userPlan: user.userPlan,
            userTimeZone: user.userTimeZone,
            notionProps: JSON.parse(user.notionProps),
            isWork: user.isWork,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            calendars: calendars.map((calendar) => ({
                id: calendar.id,
                googleCalendarId: calendar.googleCalendarId,
                googleCalendarName: calendar.googleCalendarName,
                status: calendar.status,
                accessRole: calendar.accessRole,
                notionPropertyId: calendar.notionPropertyId,
                createdAt: calendar.createdAt,
            })),
            googleCalendars: googleCalendars,
        };
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
            where: {
                userId: user.id,
                googleCalendarName: googleCalendar.summary,
            },
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

        console.log(googleCalendar);

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
            const calendar = new CalendarEntity();
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

    // private async getGoogleClient(user: UserEntity) {
    //     const oAuth2Client = new google.auth.OAuth2(
    //         process.env.GOOGLE_CLIENT_ID,
    //         process.env.GOOGLE_CLIENT_PASSWORD,
    //         process.env.GOOGLE_CALLBACK,
    //     );
    //     oAuth2Client.setCredentials({
    //         access_token: user.googleAccessToken,
    //         refresh_token: user.googleRefreshToken,
    //     });
    //     const googleClient = google.calendar({
    //         version: 'v3',
    //         auth: oAuth2Client,
    //     });
    //     return googleClient;
    // }
}
