import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CalendarEntity,
  EventEntity,
  UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';
import { UserConnectModule } from './connect/connect.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
    HttpModule,
    UserConnectModule,
  ],
})
export class UserModule {}
