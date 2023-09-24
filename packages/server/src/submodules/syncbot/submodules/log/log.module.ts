import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    SyncBotEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { SyncBotLogController } from './log.controller';
import { SyncbotLogService } from './log.service';

@Module({
    controllers: [SyncBotLogController],
    providers: [SyncbotLogService, AuthService],
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            SyncBotEntity,
            CalendarEntity,
            EventEntity,
        ]),
        HttpModule,
    ],
})
export class SyncbotLogModule {}
