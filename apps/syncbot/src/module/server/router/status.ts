import fs from 'fs/promises';
import path from 'path';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import express from 'express';

import { authGuard } from '../middleware/auth';
import { context } from '@/module/context';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

router.use(authGuard);
router.get('/', (req, res, next) => {
    res.send(context);
});

router.use(
    '/logs-static',
    authGuard,
    express.static(path.join(__dirname, '../../../../logs')),
);

router.get('/logs', async (req, res) => {
    try {
        const runnerLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/runner'),
        );
        const serverLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/server'),
        );
        const workerLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/worker'),
        );
        const runnerErrorLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/runner/error'),
        );
        const serverErrorLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/server/error'),
        );
        const workerErrorLogs = await fs.readdir(
            path.join(__dirname, '../../../../logs/worker/error'),
        );
        res.send({
            runnerLogs,
            serverLogs,
            workerLogs,
            runnerErrorLogs,
            serverErrorLogs,
            workerErrorLogs,
        });
    } catch (err) {
        console.log(err);
        res.status(404).send({});
    }
});

router.get('/logs/:date', async (req, res) => {
    try {
        const date =
            req.params['date'] === 'today'
                ? dayjs().tz('Asia/Seoul').format('YYYY-MM-DD')
                : req.params['date'];

        const runnerLog = (
            await fs.readFile(
                path.join(__dirname, `../../../../logs/runner/${date}.log`),
            )
        ).toString();

        const serverLog = (
            await fs.readFile(
                path.join(__dirname, `../../../../logs/server/${date}.log`),
            )
        ).toString();

        const workerLog = (
            await fs.readFile(
                path.join(__dirname, `../../../../logs/worker/${date}.log`),
            )
        ).toString();

        res.send({
            runnerLog: runnerLog,
            serverLog: serverLog,
            workerLog: workerLog,
        });
    } catch (err) {
        console.log(err);
        res.status(404).send({});
    }
});

export default router;
