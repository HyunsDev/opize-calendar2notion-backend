import { Controller, Get, Post, Query } from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-entity';

import { Auth } from '../user/decorator/auth.decorator';
import { User } from '../user/decorator/user.decorator';

import { accountMigrateResDto } from './dto/accountMigration.res.dto';
import { MigrationCheckResDto } from './dto/migrationCheck.res.dto';
import { Migration1Service } from './migration1.service';

@Controller('migrations/v1')
@Auth()
export class Migration1Controller {
    constructor(private readonly migration1Service: Migration1Service) {}

    @Get('check')
    async migrateCheck(
        @Query('userId') userId: number,
        @User() user: UserEntity,
    ): Promise<MigrationCheckResDto> {
        return await this.migration1Service.migrateCheck(user.id);
    }

    @Post('account-migrate')
    async accountMigrate(
        @Query('userId') userId: number,
        @User() user: UserEntity,
    ): Promise<accountMigrateResDto> {
        return await this.migration1Service.accountMigrate(user.id);
    }

    @Post('calendar-migrate')
    async calendarMigrate(
        @Query('userId') userId: number,
        @User() user: UserEntity,
    ) {
        return await this.migration1Service.calendarMigrate(user.id);
    }

    @Get('user-count')
    async userCount() {
        return await this.migration1Service.userCount();
    }
}
