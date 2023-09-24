import { Embed, Webhook } from '@hyunsdev/discord-webhook';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    Migration1Entity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-object';
import * as dayjs from 'dayjs';
import * as timezone from 'dayjs/plugin/timezone';
import * as utc from 'dayjs/plugin/utc';
import { idToUuid } from 'src/common/api-client/utils/notion/idToUuid.utils';
import { Repository } from 'typeorm';

import { accountMigrateResDto } from './dto/accountMigration.res.dto';
import { MigrationCheckResDto } from './dto/migrationCheck.res.dto';
import { Migration1UserEntity } from './entity/migration1.user.entity';
import { Migration1Error } from './error/migration.error';
import { NotionMigrate1Util } from './migration1.notion.utils';
import { Migration1Query } from './migration1.query.service';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class Migration1Service {
    webhook: Webhook;

    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        @InjectRepository(PaymentLogEntity)
        private paymentLogRepository: Repository<PaymentLogEntity>,
        @InjectRepository(CalendarEntity)
        private calendarRepository: Repository<CalendarEntity>,
        @InjectRepository(EventEntity)
        private eventRepository: Repository<EventEntity>,
        @InjectRepository(Migration1Entity)
        private migration1Repository: Repository<Migration1Entity>,

        private readonly queryManager: Migration1Query,
    ) {
        this.webhook = new Webhook(
            process.env.DISCORD_WEBHOOK_MIGRATION_NOTICE_URL,
            'Calendar2notion Backend',
            process.env.DISCORD_WEBHOOK_ICON_URL,
        );
    }

    // 마이그레이션 가능 여부를 확인합니다.
    public async migrateCheck(userId: number): Promise<MigrationCheckResDto> {
        const user = await this.getUser(userId);
        const migrateUser = await this.getMigrateUserByGoogleId(user.googleId);

        return {
            canMigrate: true,
            user: {
                id: migrateUser.id,
                imageUrl: migrateUser.imageUrl,
                email: migrateUser.email,
                name: migrateUser.name,
                createdAt: migrateUser.createdAt,
                updatedAt: migrateUser.updatedAt,
                status: migrateUser.status,
                userPlan: migrateUser.userPlan,
                notionDatabaseId: migrateUser.notionDatabaseId,
                calendars: migrateUser.calendars.map((calendar) => ({
                    id: calendar.id,
                    googleCalendarId: calendar.googleCalendarId,
                    googleCalendarName: calendar.googleCalendarName,
                    accessRole: calendar.accessRole,
                })),
            },
        };
    }

    /**
     * 계정 정보를 마이그레이션합니다.
     * @param userId
     */
    public async accountMigrate(userId: number): Promise<accountMigrateResDto> {
        const user = await this.getUser(userId);
        const migrateUser = await this.getMigrateUserByGoogleId(user.googleId);

        const canCalendarMigration =
            migrateUser.notionDatabaseId && migrateUser.status === 'finish';

        const isAlreadyMigrated = await this.migration1Repository.findOne({
            where: {
                migrationUserId: migrateUser.id,
            },
        });

        if (isAlreadyMigrated) {
            return {
                success: false,
                reason: 'ALREADY_MIGRATED',
            };
        }

        // 동기화 과정 중 기존 버전에서 동기화가 진행될 경우 오류 발생하므로 기존 버전의 동기화를 중단합니다.
        await this.queryManager.changeIsConnected(migrateUser.id, false);

        if (migrateUser.paymentLogs.length === 0) {
            const embed: Embed = new Embed({
                title: '계정 정보 마이그레이션 완료',
                fields: [
                    {
                        name: 'User',
                        value: `${migrateUser.name}(${migrateUser.email})`,
                    },
                    {
                        name: 'Plan',
                        value: migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE',
                    },
                    {
                        name: 'PaymentLog',
                        value: migrateUser.paymentLogs.length.toString(),
                    },
                ],
                thumbnail: {
                    url: migrateUser.imageUrl,
                },
                timestamp: new Date().toISOString(),
                footer: {
                    text: `calendar2notion v${process.env.npm_package_version}`,
                    icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
                },
                color: 0x03fc6f,
            });

            await this.webhook.send('', [embed]);

            return {
                success: true,
                canCalendarMigration,
                userPlan: 'FREE',
                paymentLogLength: 0,
            };
        }

        const nextPaymentTimes: Date[] = [];
        for (const oldPaymentLog of migrateUser.paymentLogs) {
            const paymentLog = PaymentLogEntity.create({
                user,
                plan: oldPaymentLog.userPlan === 'pro' ? 'PRO' : 'FREE',
                paymentKind: oldPaymentLog.paymentKind,
                price: oldPaymentLog.price,
                priceKind: oldPaymentLog.priceKind,
                paymentTime: new Date(oldPaymentLog.paymentTime),
                months: '12',
                expirationTime: new Date(oldPaymentLog.expirationTime),
                memo: `게정 정보 이전: ${oldPaymentLog.memo}\n${JSON.stringify(
                    oldPaymentLog,
                )}`,
            });

            nextPaymentTimes.push(new Date(oldPaymentLog.expirationTime));
            await this.paymentLogRepository.save(paymentLog);
        }

        nextPaymentTimes.push(new Date(user.nextPaymentTime));
        const nextPaymentTime = nextPaymentTimes.sort(
            (a, b) => b.getTime() - a.getTime(),
        )[0];

        await this.userRepository.update(
            {
                id: userId,
            },
            {
                userPlan:
                    migrateUser.userPlan === 'pro' || user.userPlan === 'PRO'
                        ? 'PRO'
                        : 'FREE',
                userTimeZone: migrateUser.userTimeZone || 'Asia/Seoul',
                nextPaymentTime: nextPaymentTime,
            },
        );

        const migration1 = Migration1Entity.create({
            step: 'ACCOUNT',
            migrationUserId: migrateUser.id,
            migrationUserName: migrateUser.name,
            migrationUserEmail: migrateUser.email,
            migrationUserGoogleId: migrateUser.googleId,
            migrationData: JSON.stringify(migrateUser),
            user,
            plan: migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE',
        });
        await this.migration1Repository.save(migration1);

        const embed: Embed = new Embed({
            title: '계정 정보 마이그레이션 완료',
            fields: [
                {
                    name: 'User',
                    value: `${migrateUser.name}(${migrateUser.email})`,
                },
                {
                    name: 'Plan',
                    value: migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE',
                },
                {
                    name: 'PaymentLog',
                    value: migrateUser.paymentLogs.length.toString(),
                },
            ],
            thumbnail: {
                url: migrateUser.imageUrl,
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: `calendar2notion v${process.env.npm_package_version}`,
                icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
            },
            color: 0x03fc6f,
        });

        await this.webhook.send('', [embed]);

        return {
            success: true,
            canCalendarMigration,
            userPlan: migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE',
            paymentLogLength: migrateUser.paymentLogs.length,
        };
    }

    public async calendarMigrate(userId: number) {
        const user = await this.getUser(userId);
        const migrateUser = await this.getMigrateUserByGoogleId(user.googleId);

        await this.queryManager.changeIsConnected(migrateUser.id, false);
        const calendarMap = await this.calendarInfoMigrate(user, migrateUser);
        const res = await this.eventMigrate(user, migrateUser, calendarMap);
        await this.connectFinish(user.id);

        const embed: Embed = new Embed({
            title: '캘린더 마이그레이션 완료',
            fields: [
                {
                    name: 'User',
                    value: `${migrateUser.name}(${migrateUser.email})`,
                },
                {
                    name: 'Calendar',
                    value: migrateUser.calendars.length.toString(),
                },
                {
                    name: 'Event',
                    value: res.count.toString(),
                },
            ],
            thumbnail: {
                url: migrateUser.imageUrl,
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: `calendar2notion v${process.env.npm_package_version}`,
                icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
            },
            color: 0x03a1fc,
        });

        await this.webhook.send('', [embed]);
        return;
    }

    public async userCount() {
        const count = await this.queryManager.findUserCount();
        return count;
    }

    private async calendarInfoMigrate(
        user: UserEntity,
        migrateUser: Migration1UserEntity,
    ) {
        const notionMigrateUtil = new NotionMigrate1Util(user, migrateUser);

        // 노션 필수 속성을 마이그레이션 합니다.
        await notionMigrateUtil.propsMigrate();

        const calendarMap: {
            migrateCalendarId: number;
            calendarId: number;
            migrateGoogleCalendarId: string;
        }[] = [];

        // 동기화 정보를 업데이트합니다.
        const propIds = notionMigrateUtil.getPropIds();
        await this.userRepository.update(
            {
                id: user.id,
            },
            {
                notionProps: JSON.stringify(propIds),
                notionDatabaseId: idToUuid(migrateUser.notionDatabaseId),
                lastCalendarSync: dayjs(migrateUser.lastCalendarSync)
                    .add(9, 'hours')
                    .toDate(),
            },
        );

        // 캘린더 정보를 업데이트합니다.
        const calendarOptions = notionMigrateUtil.getCalendarPropOptions();

        const getCalendarOptionId = (
            calendarOptions: {
                id: string;
                name: string;
                color: string;
            }[],
            googleCalendarName: string,
            userGoogleEmail: string,
        ) => {
            const calendarOption =
                calendarOptions.find(
                    (option) => option.name === googleCalendarName,
                )?.id || userGoogleEmail;
            return calendarOption;
        };

        for (const calendarData of migrateUser.calendars) {
            let calendar = CalendarEntity.create({
                user,
                accessRole:
                    calendarData.accessRole as CalendarEntity['accessRole'],
                googleCalendarId: calendarData.googleCalendarId,
                googleCalendarName: calendarData.googleCalendarName,
            });
            calendar.status = 'CONNECTED';
            calendar.notionPropertyId = getCalendarOptionId(
                calendarOptions,
                calendarData.googleCalendarName,
                user.googleEmail,
            );
            calendar = await this.calendarRepository.save(calendar);

            calendarMap.push({
                migrateCalendarId: calendarData.id,
                calendarId: calendar.id,
                migrateGoogleCalendarId: calendarData.googleCalendarId,
            });
        }

        return calendarMap;
    }

    private async eventMigrate(
        user: UserEntity,
        migrateUser: Migration1UserEntity,
        calendarMap: {
            migrateCalendarId: number;
            migrateGoogleCalendarId: string;
            calendarId: number;
        }[],
    ) {
        const eventCount = await this.queryManager.findEventsCount(
            migrateUser.id,
        );

        const pageNum = Math.ceil(eventCount / 100);

        for (let page = 1; page <= pageNum; page++) {
            const events = await this.queryManager.findEvents(
                migrateUser.id,
                page,
            );

            await this.addEvents(
                events
                    .filter((event) =>
                        calendarMap.find(
                            (calendar) =>
                                calendar.migrateGoogleCalendarId ===
                                event.gcalCalendar,
                        ),
                    )
                    .map((event) => ({
                        calendarId: calendarMap.find(
                            (calendar) =>
                                calendar.migrateGoogleCalendarId ===
                                event.gcalCalendar,
                        )?.calendarId,
                        googleCalendarCalendarId: event.gcalCalendar,
                        googleCalendarEventId: event.googleCalendarEventId,
                        lastGoogleCalendarUpdate: new Date(
                            event.lastGoogleUpdate,
                        ),
                        lastNotionUpdate: new Date(event.lastNotionUpdate),
                        notionPageId: event.notionPageId,
                        status: 'SYNCED',
                        userId: user.id,
                    })),
            );
        }

        return {
            count: eventCount,
        };
    }

    private async connectFinish(userId: number) {
        await this.userRepository.update(
            {
                id: userId,
            },
            {
                isConnected: true,
                status: 'FINISHED',
                syncYear: 0,
            },
        );
    }

    private async addEvents(
        events: {
            googleCalendarEventId: string;
            notionPageId: string;
            googleCalendarCalendarId: string;
            lastNotionUpdate: Date;
            lastGoogleCalendarUpdate: Date;
            status: 'SYNCED';
            userId: number;
            calendarId: number;
        }[],
    ) {
        const _events = events.map((event) => ({
            ...event,
            willRemove: false,
        }));

        await this.eventRepository
            .createQueryBuilder()
            .insert()
            .values(_events)
            .execute();
    }

    private async getMigrateUserByGoogleId(googleId: string) {
        const migrateUser = await this.queryManager.findOneUserByGoogleId(
            googleId,
        );
        if (!migrateUser) {
            throw new Migration1Error(
                'MIGRATE_USER_NOT_FOUND',
                '유저 정보를 찾을 수 없어요.',
                '기존에 계정이 있는지 확인해주시고, 없다면 새로운 데이터베이스를 이용하거나 오른쪽 아래 버튼을 통해 개발자에게 연락해주세요.',
                HttpStatus.NOT_FOUND,
            );
        }
        return migrateUser;
    }

    private async getUser(userId: number) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
            relations: ['notionWorkspace'],
        });
        return user;
    }
}
