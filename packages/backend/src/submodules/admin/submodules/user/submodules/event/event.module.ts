import { Module } from '@nestjs/common';
import { AdminUserEventController } from './event.controller';
import { AdminUserEventService } from './event.service';
import { UserService } from 'src/submodules/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';

@Module({
    controllers: [AdminUserEventController],
    providers: [AdminUserEventService, UserService],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        HttpModule,
    ],
})
export class AdminUserEventModule {}
