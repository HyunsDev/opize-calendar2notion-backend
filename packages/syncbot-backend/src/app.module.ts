import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import {
  CalendarEntity,
  ErrorLogEntity,
  EventEntity,
  KnownErrorEntity,
  SyncLogEntity,
  UserEntity,
} from '@opize/calendar2notion-model';

import 'dotenv/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        CalendarEntity,
        ErrorLogEntity,
        EventEntity,
        KnownErrorEntity,
        SyncLogEntity,
        UserEntity,
      ],
      charset: 'utf8mb4',
      synchronize: false,
    }),
    TypeOrmModule.forFeature([UserEntity]),
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    KnownErrorEntity,
    SyncLogEntity,
    UserEntity,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
