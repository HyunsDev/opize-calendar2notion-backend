import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from './decorator/auth.decorator';
import { User } from './decorator/user.decorator';
import { UserEntity } from '@opize/calendar2notion-model';
import { AddCalendarDto } from './dto/add-calendar.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.userService.post(createUserDto);
    }

    @Get(':id')
    @Auth()
    async findOne(@User() user: UserEntity) {
        return await this.userService.findOne(user);
    }

    @Patch(':id')
    @Auth()
    async update(
        @User() user: UserEntity,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return await this.userService.update(user, updateUserDto);
    }

    @Delete(':id')
    @Auth()
    async remove(@User() user: UserEntity) {
        return await this.userService.remove(user);
    }

    @Post(':id/reset')
    @Auth()
    async reset(@User() user: UserEntity) {
        return await this.userService.reset(user);
    }

    @Post(':id/calendar')
    @Auth()
    async addCalendar(
        @User() user: UserEntity,
        @Body() addCalendarDto: AddCalendarDto,
    ) {
        return await this.userService.addCalendar(user, addCalendarDto);
    }

    @Delete(':id/calendar/:calendarId')
    @Auth()
    async removeCalendar(
        @User() user: UserEntity,
        @Param('calendarId') calendarId: string,
    ) {
        return await this.userService.removeCalendar(user, +calendarId);
    }
}
