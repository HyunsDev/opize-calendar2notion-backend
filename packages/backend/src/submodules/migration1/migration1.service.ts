import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Migration1Query } from './migration1.query.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    Migration1Entity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { Repository } from 'typeorm';
import { MigrationCheckResDto } from './dto/migrationCheck.res.dto';
import { accountMigrateResDto } from './dto/accountMigration.res.dto';
import { calendarMigrateResDto } from './dto/calendarMigration.res.dto';
import { NotionMigrate1Util } from './migration1.notion.utils';
import { Migration1StreamHelper } from './migration1.stream.helper';
import { sleep } from 'src/common/utils/sleep';
import { Migration1UserEntity } from './entity/migration1.user.entity';

@Injectable()
export class Migration1Service {
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
    ) {}

    // 마이그레이션 가능 여부를 확인합니다.
    async migrateCheck(userId: number): Promise<MigrationCheckResDto> {
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
    async accountMigrate(userId: number): Promise<accountMigrateResDto> {
        const user = await this.getUser(userId);
        const migrateUser = await this.getMigrateUserByGoogleId(user.googleId);

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

        if (migrateUser.paymentLogs.length === 0) {
            return {
                success: true,
                userPlan: 'FREE',
                paymentLogLength: 0,
            };
        }

        const nextPaymentTimes: Date[] = [];
        for (const oldPaymentLog of migrateUser.paymentLogs) {
            const paymentLog = new PaymentLogEntity();
            paymentLog.userId = userId;
            paymentLog.plan = oldPaymentLog.userPlan === 'pro' ? 'PRO' : 'FREE';
            paymentLog.paymentKind = oldPaymentLog.paymentKind;
            paymentLog.price = oldPaymentLog.price;
            paymentLog.priceKind = oldPaymentLog.priceKind;
            paymentLog.paymentTime = new Date(oldPaymentLog.paymentTime);
            paymentLog.months = '12';
            paymentLog.expirationTime = new Date(oldPaymentLog.expirationTime);
            paymentLog.memo = `게정 정보 이전: ${
                oldPaymentLog.memo
            }\n${JSON.stringify(oldPaymentLog)}`;

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

        const migration1 = new Migration1Entity();
        migration1.step = 'ACCOUNT';
        migration1.migrationUserId = migrateUser.id;
        migration1.migrationUserName = migrateUser.name;
        migration1.migrationUserEmail = migrateUser.email;
        migration1.migrationUserGoogleId = migrateUser.googleId;
        migration1.migrationData = JSON.stringify(migrateUser);
        migration1.userId = userId;
        migration1.plan = migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE';
        await this.migration1Repository.save(migration1);

        return {
            success: true,
            userPlan: migrateUser.userPlan === 'pro' ? 'PRO' : 'FREE',
            paymentLogLength: migrateUser.paymentLogs.length,
        };
    }

    async calendarMigrate(userId: number) {
        const user = await this.getUser(userId);
        const migrateUser = await this.getMigrateUserByGoogleId(user.googleId);

        const calendarMap = await this.calendarInfoMigrate(user, migrateUser);
        await this.eventMigrate(user, migrateUser, calendarMap);
        await this.connectFinish(user.id);
        return;
    }

    private async calendarInfoMigrate(
        user: UserEntity,
        migrateUser: Migration1UserEntity,
    ) {
        const notionMigrateUtil = new NotionMigrate1Util(user, migrateUser);

        const props = await notionMigrateUtil.propsMigrate();
        if (!props.success) {
            console.log('노션 마이그레이션 실패');
            console.log('속성을 마이그레이션 하지 못했어요.');
            // streamHelper.send({
            //     migrationStatus: 'error',
            //     step: 'notion_database_migrating',
            //     message: '노션 데이터베이스 마이그레이션 실패',
            // });
        }

        const calendarMap: {
            migrateCalendarId: number;
            calendarId: number;
            migrateGoogleCalendarId: string;
        }[] = [];

        await this.userRepository.update(
            {
                id: user.id,
            },
            {
                notionProps: JSON.stringify(props.props),
                notionDatabaseId: migrateUser.notionDatabaseId,
                lastCalendarSync: new Date(migrateUser.lastCalendarSync),
            },
        );

        for (const calendarData of migrateUser.calendars) {
            let calendar = new CalendarEntity();
            calendar.userId = user.id;
            calendar.googleCalendarId = calendarData.googleCalendarId;
            calendar.googleCalendarName = calendarData.googleCalendarName;
            calendar.accessRole =
                calendarData.accessRole as CalendarEntity['accessRole'];
            calendar.status = 'CONNECTED';
            calendar.notionPropertyId =
                props.props[calendarData.googleCalendarId];
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
                events.map((event) => ({
                    calendarId: calendarMap.find(
                        (calendar) =>
                            calendar.migrateGoogleCalendarId ===
                            event.gcalCalendar,
                    )?.calendarId,
                    googleCalendarCalendarId: event.gcalCalendar,
                    googleCalendarEventId: event.googleCalendarEventId,
                    lastGoogleCalendarUpdate: new Date(event.lastGoogleUpdate),
                    lastNotionUpdate: new Date(event.lastNotionUpdate),
                    notionPageId: event.notionPageId,
                    status: 'SYNCED',
                    userId: user.id,
                })),
            );

            console.log(`페이지 ${page}/${pageNum}: 이벤트 ${events.length}개`);
        }

        console.log('이벤트 마이그레이션 완료');
    }

    private async connectFinish(userId: number) {
        await this.userRepository.update(
            {
                id: userId,
            },
            {
                isConnected: true,
                status: 'FINISHED',
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
            throw new NotFoundException({
                code: 'MIGRATE_USER_NOT_FOUND',
            });
        }
        return migrateUser;
    }

    private async getUser(userId: number) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });
        return user;
    }
}
