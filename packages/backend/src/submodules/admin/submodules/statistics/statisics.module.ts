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
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

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
