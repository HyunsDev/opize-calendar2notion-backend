import { Module } from '@nestjs/common';
import { SyncBotLogController } from './log.controller';
import { SyncbotLogService } from './log.service';
import { UserService } from 'src/submodules/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    SyncBotEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';

@Module({
    controllers: [SyncBotLogController],
    providers: [SyncbotLogService, UserService],
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
