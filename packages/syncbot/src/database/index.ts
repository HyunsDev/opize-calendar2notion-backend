import {
    UserEntity,
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    KnownErrorEntity,
    PaymentLogEntity,
    SyncBotEntity,
} from '@opize/calendar2notion-model';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: false,
    entities: [
        UserEntity,
        CalendarEntity,
        ErrorLogEntity,
        EventEntity,
        KnownErrorEntity,
        PaymentLogEntity,
        SyncBotEntity,
    ],
    subscribers: [],
    migrations: [],
});

export const DB = {
    user: AppDataSource.getRepository(UserEntity),
    calendar: AppDataSource.getRepository(CalendarEntity),
    errorLog: AppDataSource.getRepository(ErrorLogEntity),
    event: AppDataSource.getRepository(EventEntity),
    knownError: AppDataSource.getRepository(KnownErrorEntity),
    paymentLog: AppDataSource.getRepository(PaymentLogEntity),
};
// (async () => {
//     await AppDataSource.initialize();
//     const userRepo = AppDataSource.getRepository(UserEntity);
// })();
