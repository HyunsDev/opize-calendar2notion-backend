import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    KnownErrorEntity,
    SyncBotEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PaymentLogEntity } from '@opize/calendar2notion-model/dist/entity/paymentLog.entity';
import { SyncbotModule } from './syncbot/syncbot.module';

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
                KnownErrorEntity,
                UserEntity,
                PaymentLogEntity,
                SyncBotEntity,
            ],
            charset: 'utf8mb4',
            synchronize: process.env.DB_SYNCHRONIZE === 'true',
        }),
        CalendarEntity,
        ErrorLogEntity,
        EventEntity,
        KnownErrorEntity,
        PaymentLogEntity,
        UserEntity,
        UserModule,
        AdminModule,
        SyncbotModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
