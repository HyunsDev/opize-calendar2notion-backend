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
import { UserService } from '../user.service';

@Module({
    controllers: [UserConnectController],
    providers: [UserConnectService, UserService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class UserConnectModule {}
