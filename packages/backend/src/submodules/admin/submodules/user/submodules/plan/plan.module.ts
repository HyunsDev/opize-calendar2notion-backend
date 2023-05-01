import { Module } from '@nestjs/common';
import { AdminUserPlanController } from './plan.controller';
import { AdminUserPlanService } from './plan.service';
import { UserService } from 'src/submodules/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
    CalendarEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';

@Module({
    controllers: [AdminUserPlanController],
    providers: [AdminUserPlanService, UserService],
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            CalendarEntity,
            EventEntity,
            PaymentLogEntity,
        ]),
        HttpModule,
    ],
})
export class AdminUserPlanModule {}
