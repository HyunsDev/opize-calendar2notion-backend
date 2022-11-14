import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Sse,
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

  @Post('syncbot/:prefix/stop')
  async stop(@Param('prefix') prefix: string) {
    return await this.syncbotService.stopSyncbot(prefix);
  }

  @Post('syncbot/:prefix/exit')
  async exit(@Param('prefix') prefix: string) {
    return await this.syncbotService.exitSyncbot(prefix);
  }
}
