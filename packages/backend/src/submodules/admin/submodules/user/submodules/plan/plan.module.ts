import { Module } from '@nestjs/common';
import { AdminUserPlanController } from './plan.controller';
import { AdminUserPlanService } from './plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
    CalendarEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

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
