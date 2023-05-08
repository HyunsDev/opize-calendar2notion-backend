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
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

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
