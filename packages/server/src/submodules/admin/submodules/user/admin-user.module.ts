import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-object';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';

@Module({
    controllers: [AdminUserController],
    providers: [AdminUserService, AuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class AdminUserModule {}
