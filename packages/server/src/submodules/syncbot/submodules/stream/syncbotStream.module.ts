import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncBotEntity } from '@opize/calendar2notion-entity';

import { SyncbotStreamController } from './syncbotStream.controller';
import { SyncbotStreamService } from './syncbotStream.service';

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
