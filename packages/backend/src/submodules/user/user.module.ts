import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';

import { AuthService } from './submodules/auth/auth.service';
import { OpizeAuthService } from './submodules/auth/opize.auth.service';
import { UserConnectModule } from './submodules/connect/connect.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    controllers: [UserController],
    providers: [UserService, AuthService, OpizeAuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
        UserConnectModule,
    ],
})
export class UserModule {}
