import express from 'express';
import { managerStorage } from '../../../manager/storage';

const router = express.Router();

router.get('/', (req, res, next) => {
    res.send(managerStorage.data);
});

export default router;
