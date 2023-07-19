import * as path from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    Migration1Entity,
    NotionWorkspaceEntity,
    SyncBotEntity,
    UserEntity,
    PaymentLogEntity,
} from '@opize/calendar2notion-object';
import * as dotenv from 'dotenv';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './common/env/env.validation';
import { AdminErrorModule } from './submodules/admin/submodules/error/error.module';
import { AdminStatisticsModule } from './submodules/admin/submodules/statistics/statisics.module';
import { AdminToolsModule } from './submodules/admin/submodules/tools/tools.module';
import { AdminUserModule } from './submodules/admin/submodules/user/admin-user.module';
import { AdminUserEventModule } from './submodules/admin/submodules/user/submodules/event/event.module';
import { AdminUserPlanModule } from './submodules/admin/submodules/user/submodules/plan/plan.module';
import { Migration1Module } from './submodules/migration1/migration1.module';
import { SyncbotLogModule } from './submodules/syncbot/submodules/log/log.module';
import { SyncbotModule } from './submodules/syncbot/syncbot.module';
import { UserModule } from './submodules/user/user.module';

dotenv.config({
    path: path.resolve(process.env.NODE_ENV === 'production' ? '.env' : '.env'),
});

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            entities: [
                CalendarEntity,
                ErrorLogEntity,
                EventEntity,
                UserEntity,
                PaymentLogEntity,
                SyncBotEntity,
                Migration1Entity,
                NotionWorkspaceEntity,
            ],
            charset: 'utf8mb4',
            synchronize: process.env.DB_SYNCHRONIZE === 'true',
        }),
        UserModule,
        SyncbotModule,
        AdminUserModule,
        AdminUserEventModule,
        AdminUserPlanModule,
        AdminStatisticsModule,
        AdminErrorModule,
        SyncbotLogModule,
        Migration1Module,
        AdminToolsModule,
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validate,
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
