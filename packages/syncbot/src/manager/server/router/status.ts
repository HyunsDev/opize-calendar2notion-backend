import express from 'express';
import path from 'path';
import { managerStorage } from '../../../manager/storage';
import { authGuard } from '../middleware/auth';
import fs from 'fs/promises';
import dayjs from 'dayjs';

const router = express.Router();

router.use(authGuard);
router.get('/', (req, res, next) => {
    res.send(managerStorage.data);
});

router.use(
    '/logs-static',
    authGuard,
    express.static(path.join(__dirname, '../../../../logs')),
);

router.use('/logs/today', async (req, res) => {
    const today = dayjs().format('YYYY-MM-DD');

    const runnerLog = (
        await fs.readFile(
            path.join(__dirname, `../../../../logs/runner/${today}.log`),
        )
    ).toString();

    const serverLog = (
        await fs.readFile(
            path.join(__dirname, `../../../../logs/server/${today}.log`),
        )
    ).toString();

    const workerLog = (
        await fs.readFile(
            path.join(__dirname, `../../../../logs/worker/${today}.log`),
        )
    ).toString();

    res.send({
        runner: runnerLog,
        serverLog: serverLog,
        workerLog: workerLog,
    });
});

export default router;
