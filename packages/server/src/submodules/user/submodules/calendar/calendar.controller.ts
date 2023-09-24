import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-object';

import { Auth } from '../../decorator/auth.decorator';
import { User } from '../../decorator/user.decorator';
import { AddCalendarDto } from '../../dto/add-calendar.dto';

import { UserCalendarService } from './calendar.service';

@Controller('users/:userId/calendar')
@Auth()
export class UserCalendarController {
    constructor(private readonly userCalendarService: UserCalendarService) {}

    @Post('')
    async addCalendar(
        @User() user: UserEntity,
        @Body() addCalendarDto: AddCalendarDto,
    ) {
        return await this.userCalendarService.addCalendar(user, addCalendarDto);
    }

    @Delete(':calendarId')
    async removeCalendar(
        @User() user: UserEntity,
        @Param('calendarId') calendarId: string,
    ) {
        return await this.userCalendarService.removeCalendar(user, +calendarId);
    }
}
