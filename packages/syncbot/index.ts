import 'dotenv/config';
import { manager } from './src/manager';
import { AppDataSource } from './src/database';

(async () => {
    await AppDataSource.initialize();
    await manager();
})();
