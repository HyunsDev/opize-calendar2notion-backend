import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-object';

import { AuthService } from '../auth/auth.service';

import { UserCalendarController } from './calendar.controller';
import { UserCalendarService } from './calendar.service';

@Module({
    controllers: [UserCalendarController],
    providers: [UserCalendarService, AuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
    ],
})
export class UserCalendarModule {}
