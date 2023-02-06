import { Module } from '@nestjs/common';
import { SyncbotStreamService } from './syncbotStream.service';
import { SyncbotStreamController } from './syncbotStream.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [SyncbotStreamController],
  providers: [SyncbotStreamService],
  imports: [
    SyncbotStreamModule,
    TypeOrmModule.forFeature([SyncBotEntity]),
    HttpModule,
  ],
})
export class SyncbotStreamModule {}
