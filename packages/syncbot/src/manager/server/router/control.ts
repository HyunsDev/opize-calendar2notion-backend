import express from 'express';
import path from 'path';
import { managerStorage } from '../../../manager/storage';
import { authGuard } from '../middleware/auth';
import fs from 'fs/promises';
import dayjs from 'dayjs';

const router = express.Router();

router.use(authGuard);
router.post('/stop', (req, res, next) => {
    managerStorage.data.stop = true;
    res.status(204).send();
});
router.post('/exit', (req, res, next) => {
    process.exit(0);
});

export default router;
