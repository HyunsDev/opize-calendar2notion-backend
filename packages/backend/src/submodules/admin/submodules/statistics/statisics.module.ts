import { Module } from '@nestjs/common';
import { AdminStatisticsController } from './statisics.controller';
import { UserService } from 'src/submodules/user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { AdminStatisticsService } from './statistics.service';

@Module({
    controllers: [AdminStatisticsController],
    providers: [AdminStatisticsService, UserService],
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
