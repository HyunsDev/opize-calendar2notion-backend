import 'reflect-metadata';
import 'dotenv/config';
import { ENV } from './src/env/env';
import { manager } from './src/manager';
import { AppDataSource } from './src/database';

(async () => {
    console.log(ENV.DB_DATABASE);
    await AppDataSource.initialize();
    await manager();
})();
