import { Module } from '@nestjs/common';
import { SyncbotService } from './syncbot.service';
import { SyncbotController } from './syncbot.controller';
import { SyncbotStreamModule } from './submodules/stream/syncbotStream.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    SyncBotEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { UserService } from 'src/submodules/user/user.service';
import { AuthService } from '../user/submodules/auth/auth.service';

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
