import { Injectable } from '@nestjs/common';
import { Migration1Query } from './migration1query.service';

@Injectable()
export class Migration1Service {
    constructor(private readonly queryManager: Migration1Query) {}

    // 마이그레이션 가능 여부를 확인합니다.
    async migrateCheck(userId: number) {
        const user = await this.getOlduser(userId);

        if (!user) {
            return {
                canMigrate: false,
                reason: 'USER_NOT_FOUND',
            };
        }

        return {
            canMigrate: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                status: user.status,
                userPlan: user.userPlan,
                calendars: user.calendars.map((calendar) => ({
                    id: calendar.id,
                    googleCalendarId: calendar.googleCalendarId,
                    googleCalendarName: calendar.googleCalendarName,
                    accessRole: calendar.accessRole,
                })),
            },
        };
    }

    /**
     * 플랜 정보만 마이그레이션합니다.
     * @param userId
     */
    async softMigrate(userId: number) {}

    /**
     * 데이터베이스와 함께 마이그레이션합니다.
     * @param userId
     * @returns
     */
    async hardMigrate(userId: number) {}

    private async getOlduser(userId: number) {
        const user = await this.queryManager.findOneUser(userId);
        return user;
    }
}
