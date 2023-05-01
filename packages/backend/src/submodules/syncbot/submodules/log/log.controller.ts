import { Controller, Get, Param, Query } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';
import { SyncbotLogService } from './log.service';

@Controller('admin/syncbots')
@Auth('admin')
export class SyncBotLogController {
    constructor(private readonly syncbotLogService: SyncbotLogService) {}

    @Get(':prefix/logs/:date')
    async getLogs(
        @Param('prefix') prefix: string,
        @Param('date') date: string | 'today',
    ) {
        return await this.syncbotLogService.getLogs(prefix, date);
    }

    @Get(':prefix/logs-static')
    async getStaticLog(
        @Param('prefix') prefix: string,
        @Query('fileName') fileName: string,
    ) {
        return await this.syncbotLogService.getStaticLog(prefix, fileName);
    }

    @Get(':prefix/logs')
    async getLogList(@Param('prefix') prefix: string) {
        return await this.syncbotLogService.getList(prefix);
    }
}
