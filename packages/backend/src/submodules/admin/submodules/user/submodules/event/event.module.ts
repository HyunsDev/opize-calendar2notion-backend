import { Module } from '@nestjs/common';
import { AdminUserEventController } from './event.controller';
import { AdminUserEventService } from './event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

@Module({
    controllers: [AdminUserEventController],
    providers: [AdminUserEventService, AuthService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class AdminUserEventModule {}
