import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { AdminStatisticsController } from './statisics.controller';
import { AdminStatisticsService } from './statistics.service';

@Module({
    controllers: [AdminStatisticsController],
    providers: [AdminStatisticsService, AuthService],
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            CalendarEntity,
            EventEntity,
            PaymentLogEntity,
            ErrorLogEntity,
        ]),
        HttpModule,
    ],
})
export class AdminStatisticsModule {}
