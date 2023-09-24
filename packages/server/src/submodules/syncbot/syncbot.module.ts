import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    SyncBotEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';

import { AuthService } from '../user/submodules/auth/auth.service';

import { SyncbotStreamModule } from './submodules/stream/syncbotStream.module';
import { SyncbotController } from './syncbot.controller';
import { SyncbotService } from './syncbot.service';

@Module({
    controllers: [SyncbotController],
    providers: [SyncbotService, AuthService],
    imports: [
        SyncbotStreamModule,
        TypeOrmModule.forFeature([
            SyncBotEntity,
            UserEntity,
            CalendarEntity,
            EventEntity,
        ]),
        HttpModule,
    ],
})
export class SyncbotModule {}
