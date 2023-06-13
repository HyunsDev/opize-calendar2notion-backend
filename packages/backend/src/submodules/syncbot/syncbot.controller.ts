import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { Auth } from 'src/submodules/user/decorator/auth.decorator';
import { AddSyncBotDto } from './dto/add-syncbot.dto';
import { SyncbotService } from './syncbot.service';

@Controller('syncbots')
@Auth('admin')
export class SyncbotController {
    constructor(private readonly syncbotService: SyncbotService) {}

    @Get('')
    async getSyncBots() {
        return await this.syncbotService.get();
    }

    @Post('')
    async post(@Body() dto: AddSyncBotDto) {
        return await this.syncbotService.post(dto);
    }

    @Delete(':prefix')
    async delete(@Param('prefix') prefix: string) {
        return await this.syncbotService.delete(prefix);
    }

    @Post(':prefix/stop')
    async stop(@Param('prefix') prefix: string) {
        return await this.syncbotService.stopSyncbot(prefix);
    }

    @Post(':prefix/exit')
    async exit(@Param('prefix') prefix: string) {
        return await this.syncbotService.exitSyncbot(prefix);
    }
}
