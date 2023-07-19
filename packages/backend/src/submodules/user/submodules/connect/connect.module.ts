import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    NotionWorkspaceEntity,
    UserEntity,
} from '@opize/calendar2notion-object';

import { UserService } from '../../user.service';
import { AuthService } from '../auth/auth.service';
import { OpizeAuthService } from '../auth/opize.auth.service';

import { UserConnectNotionService } from './connect-notion.service';
import { UserConnectController } from './connect.controller';
import { UserConnectService } from './connect.service';

@Module({
    controllers: [UserConnectController],
    providers: [
        UserConnectService,
        UserService,
        AuthService,
        OpizeAuthService,
        UserConnectNotionService,
    ],
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            CalendarEntity,
            EventEntity,
            NotionWorkspaceEntity,
        ]),
        HttpModule,
    ],
})
export class UserConnectModule {}
