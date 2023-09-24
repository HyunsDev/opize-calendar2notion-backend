import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-entity';

import { Auth } from './decorator/auth.decorator';
import { User } from './decorator/user.decorator';
import { AddCalendarDto } from './dto/add-calendar.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
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
}
