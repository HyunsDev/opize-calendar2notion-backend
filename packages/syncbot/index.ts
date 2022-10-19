import {
    UserEntity,
    CalendarEntity,
    ErrorLogEntity,
    EventEntity,
    KnownErrorEntity,
    SyncLogEntity,
} from '@opize/calendar2notion-model';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import 'dotenv/config';

export const AppDataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true,
    logging: false,
    entities: [
        UserEntity,
        CalendarEntity,
        ErrorLogEntity,
        EventEntity,
        KnownErrorEntity,
        SyncLogEntity,
    ],
    subscribers: [],
    migrations: [],
});

(async () => {
    await AppDataSource.initialize();
    const userRepo = AppDataSource.getRepository(UserEntity);

    const res = await userRepo.find();

    console.log(res);
})();
