import express from 'express';
import { managerStorage } from '../../../manager/storage';
import { authGuard } from '../middleware/auth';
import { AppDataSource } from '../../../database';

const router = express.Router();

router.use(authGuard);
router.post('/stop', (req, res) => {
    managerStorage.data.stop = true;
    res.status(204).send();
});
router.post('/exit', (req, res) => {
    res.status(200).send({
        message: '30초 이내에 종료됩니다.',
    });
    managerStorage.data.stop = true;

    setTimeout(async () => {
        await AppDataSource.destroy();
        process.exit(0);
    }, 30000);
});

export default router;
