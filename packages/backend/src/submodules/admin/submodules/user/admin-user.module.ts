import { Module } from '@nestjs/common';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { UserService } from 'src/submodules/user/user.service';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

@Module({
    controllers: [AdminUserController],
    providers: [AdminUserService, AuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class AdminUserModule {}