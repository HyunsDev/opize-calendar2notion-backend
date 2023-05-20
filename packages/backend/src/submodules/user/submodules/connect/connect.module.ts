import { Module } from '@nestjs/common';
import { UserConnectService } from './connect.service';
import { UserConnectController } from './connect.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { UserService } from '../../user.service';
import { AuthService } from '../auth/auth.service';
import { OpizeAuthService } from '../auth/opize.auth.service';

@Module({
    controllers: [UserConnectController],
    providers: [UserConnectService, UserService, AuthService, OpizeAuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class UserConnectModule {}
