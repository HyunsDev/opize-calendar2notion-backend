import { Module } from '@nestjs/common';
import { Migration1Service } from './migration1.service';
import { Migration1Query } from './migration1query.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    CalendarEntity,
    EventEntity,
    UserEntity,
} from '@opize/calendar2notion-model';
import { HttpModule } from '@nestjs/axios';

import * as dotenv from 'dotenv';
import * as path from 'path';
import { Migration1Controller } from './migration1.controller';
import { AuthService } from '../user/submodules/auth/auth.service';

dotenv.config({
    path: path.resolve(process.env.NODE_ENV === 'production' ? '.env' : '.env'),
});

@Module({
    providers: [Migration1Service, Migration1Query, AuthService],
    controllers: [Migration1Controller],
    imports: [
        TypeOrmModule.forFeature([UserEntity, CalendarEntity, EventEntity]),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.MIGRATION_DB_HOST,
            port: Number(process.env.MIGRATION_DB_PORT),
            username: process.env.MIGRATION_DB_USERNAME,
            password: process.env.MIGRATION_DB_PASSWORD,
            database: process.env.MIGRATION_DB_DATABASE,
            charset: 'utf8',
            synchronize: false,
            name: 'migration-db',
        }),
        TypeOrmModule.forFeature(),
        HttpModule,
    ],
})
export class Migration1Module {}
