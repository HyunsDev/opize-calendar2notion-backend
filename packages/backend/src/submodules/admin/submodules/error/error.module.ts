import { Module } from '@nestjs/common';
import { AdminErrorController } from './error.controller';
import { AdminErrorService } from './error.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { UserService } from 'src/submodules/user/user.service';

@Module({
    controllers: [AdminErrorController],
    providers: [AdminErrorService, UserService],
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            CalendarEntity,
            PaymentLogEntity,
            ErrorLogEntity,
            EventEntity,
        ]),
        HttpModule,
    ],
})
export class AdminErrorModule {}
