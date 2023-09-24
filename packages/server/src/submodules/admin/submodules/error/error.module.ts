import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    PaymentLogEntity,
    UserEntity,
} from '@opize/calendar2notion-entity';
import { AuthService } from 'src/submodules/user/submodules/auth/auth.service';

import { AdminErrorController } from './error.controller';
import { AdminErrorService } from './error.service';

@Module({
    controllers: [AdminErrorController],
    providers: [AdminErrorService, AuthService],
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
