import { Body, Controller, Get, Query } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';

import { GetNotionDatabaseReqDto } from './dto/getNotionDatabase.req.dto';
import { AdminNotionToolsService } from './notionTools.service';
import { AdminToolsService } from './tools.service';

@Controller('admin/tools')
@Auth('admin')
export class AdminToolsController {
    constructor(
        private readonly adminToolsService: AdminToolsService,
        private readonly adminNotionToolsService: AdminNotionToolsService,
    ) {}

    @Get('notion-database')
    async GetNotionDatabase(@Query() dto: GetNotionDatabaseReqDto) {
        const user = await this.adminToolsService.getUser(+dto.userId);
        return await this.adminNotionToolsService.getNotionDatabase(user);
    }
}
