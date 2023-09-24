import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { AdminUserPlanController } from './plan.controller';
import { AdminUserPlanService } from './plan.service';

@Module({
    controllers: [AdminUserPlanController],
    providers: [AdminUserPlanService, AuthService],
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
