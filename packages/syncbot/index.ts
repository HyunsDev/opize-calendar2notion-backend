import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './src/database';
import { manager } from './src/manager';
import { statusReporter } from './src/statusReport';

(async () => {
    await AppDataSource.initialize();
    await statusReporter.startLoop();
    await manager();
})();
