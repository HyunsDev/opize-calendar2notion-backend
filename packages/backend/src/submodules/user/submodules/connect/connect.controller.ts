import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserEntity } from '@opize/calendar2notion-model';

import { Auth } from '../../decorator/auth.decorator';
import { User } from '../../decorator/user.decorator';

import { UserConnectService } from './connect.service';
import { GoogleAccountDTO } from './dto/googleAccount.dto';
import { NotionAccountDTO } from './dto/notionAccount.dto';

@Controller('users/:id/connect')
@Auth()
export class UserConnectController {
    constructor(private readonly userConnectService: UserConnectService) {}

    @Post('google-api')
    async GoogleAccount(
        @Body() googleAccountDTO: GoogleAccountDTO,
        @User() user: UserEntity,
    ) {
        return await this.userConnectService.googleAccount(
            googleAccountDTO,
            user,
        );
    }

    @Post('notion-api')
    async NotionAccount(
        @Body() notionAccountDTO: NotionAccountDTO,
        @User() user: UserEntity,
    ) {
        return await this.userConnectService.notionAccount(
            notionAccountDTO,
            user,
        );
    }

    @Get('notion-database')
    async GetNotionDatabase(@User() user: UserEntity) {
        return await this.userConnectService.getNotionDatabases(user);
    }

    @Post('notion-database')
    async NotionDatabase(@User() user: UserEntity) {
        return await this.userConnectService.setNotionDatabase(user);
    }
}
