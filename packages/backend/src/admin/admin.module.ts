import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  CalendarEntity,
  ErrorLogEntity,
  EventEntity,
  UserEntity,
} from '@opize/calendar2notion-model';
import { PaymentLogEntity } from '@opize/calendar2notion-model/dist/entity/paymentLog.entity';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, UserService],
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
export class AdminModule {}
