import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
} from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';

import { AdminUserService } from './admin-user.service';
import { SearchUserReqDto } from './dto/searchUser.req.dto';
import { SearchUsersReqDto } from './dto/searchUsers.req.dto';
import { UpdateUserReqDto } from './dto/updateUser.req.dto';

@Controller('admin/users')
@Auth('admin')
export class AdminUserController {
    constructor(private readonly adminUserService: AdminUserService) {}

    @Get('search')
    async searchUser(@Query() dto: SearchUserReqDto) {
        const option = {
            email: dto.email,
            googleEmail: dto.googleEmail,
            id: dto.id ? +dto.id : undefined,
            opizeId: dto.opizeId ? +dto.opizeId : undefined,
        };
        return await this.adminUserService.searchUser(option);
    }

    @Get('expiration-users')
    async getExpirationUsers() {
        return await this.adminUserService.getExpirationUsers();
    }

    @Get(':userId')
    async getUser(@Param('userId') userId: string) {
        return await this.adminUserService.searchUser({
            id: +userId,
        });
    }

    @Patch(':userId')
    async patchUser(
        @Param('userId') userId: string,
        @Body() dto: UpdateUserReqDto,
    ) {
        return await this.adminUserService.updateUser(+userId, dto);
    }

    @Get('')
    async searchUsers(@Query() dto: SearchUsersReqDto) {
        let where: any;
        try {
            where = JSON.parse(dto.where);
        } catch (err) {
            throw new BadRequestException({
                message: 'where 파라미터가 올바르지 않습니다.',
            });
        }
        return await this.adminUserService.searchUsers(where, +dto.page);
    }
}
