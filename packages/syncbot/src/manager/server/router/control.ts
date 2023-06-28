import { Embed } from '@hyunsdev/discord-webhook';
import express from 'express';

import { AppDataSource } from '../../../database';
import { webhook } from '../../../logger/webhook';
import { managerStorage } from '../../../manager/storage';
import { authGuard } from '../middleware/auth';

const router = express.Router();

router.use(authGuard);
router.post('/stop', async (req, res) => {
    managerStorage.data.stop = true;

    const embed = new Embed({
        title: '종료 요청을 받았습니다.',
        color: 0x00ff00,
        description: ``,
        timestamp: new Date().toISOString(),
        footer: {
            text: `calendar2notion v${process.env.npm_package_version}`,
            icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
        },
    });
    await webhook.notice.send('', [embed]);

    res.status(204).send();
});
router.post('/exit', async (req, res) => {
    const embed = new Embed({
        title: '강제 종료 요청을 받았습니다.',
        color: 0x00ff00,
        description: ``,
        timestamp: new Date().toISOString(),
        footer: {
            text: `calendar2notion v${process.env.npm_package_version}`,
            icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
        },
    });
    await webhook.notice.send('', [embed]);

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
