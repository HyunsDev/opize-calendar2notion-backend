import 'reflect-metadata';
import 'dotenv/config';
import { manager } from './src/manager';
import { AppDataSource } from './src/database';
import { statusReporter } from './src/statusReport';

(async () => {
    await AppDataSource.initialize();
    await statusReporter.startLoop();
    await manager();
})();
