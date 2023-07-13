import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@opize/calendar2notion-model';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { AdminGoogleCalendarToolsService } from './googleCalendarTools.service';
import { AdminNotionToolsService } from './notionTools.service';
import { AdminToolsController } from './tools.controller';
import { AdminToolsService } from './tools.service';

@Module({
    controllers: [AdminToolsController],
    providers: [
        AdminToolsService,
        AdminNotionToolsService,
        AdminGoogleCalendarToolsService,
        AuthService,
    ],
    imports: [TypeOrmModule.forFeature([UserEntity])],
})
export class AdminToolsModule {}
