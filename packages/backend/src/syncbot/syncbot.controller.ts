import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Sse,
  Query,
  Header,
} from '@nestjs/common';
import { Auth } from 'src/user/decorator/auth.decorator';
import { AddSyncBotDto } from './dto/add-syncbot.dto';
import { SyncbotService } from './syncbot.service';

@Controller()
@Auth('admin')
export class SyncbotController {
  constructor(private readonly syncbotService: SyncbotService) {}

  @Get('syncbots')
  async getSyncBots() {
    return await this.syncbotService.get();
  }

  @Post('syncbots')
  async post(@Body() dto: AddSyncBotDto) {
    return await this.syncbotService.post(dto);
  }

  @Delete('syncbots/:prefix')
  async delete(@Param('prefix') prefix: string) {
    return await this.syncbotService.delete(prefix);
  }

  @Post('syncbots/:prefix/stop')
  async stop(@Param('prefix') prefix: string) {
    return await this.syncbotService.stopSyncbot(prefix);
  }

  @Post('syncbots/:prefix/exit')
  async exit(@Param('prefix') prefix: string) {
    return await this.syncbotService.exitSyncbot(prefix);
  }

  @Get('syncbots/:prefix/logs/:date')
  async getLogs(
    @Param('prefix') prefix: string,
    @Param('date') date: string | 'today',
  ) {
    return await this.syncbotService.syncBotLog(prefix, date);
  }

  @Get('syncbots/:prefix/logs-static')
  async getStaticLog(
    @Param('prefix') prefix: string,
    @Query('fileName') fileName: string,
  ) {
    return await this.syncbotService.syncBotStaticLog(prefix, fileName);
  }

  @Get('syncbots/:prefix/logs')
  async getLogList(@Param('prefix') prefix: string) {
    return await this.syncbotService.syncBotLogList(prefix);
  }
}
