import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './database';
import { Runner } from './module/runner';
import app from './module/server';
import { Embed } from '@hyunsdev/discord-webhook';
import { webhook } from './logger/webhook';

(async () => {
    await AppDataSource.initialize();

    const server = app;
    server.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });

    const runner = new Runner();
    await runner.run();

    await AppDataSource.destroy();

    const embed = new Embed({
        title: '동기화봇을 종료합니다.',
        color: 0x00ff00,
        description: ``,
        timestamp: new Date().toISOString(),
        footer: {
            text: `calendar2notion v${process.env.npm_package_version}`,
            icon_url: process.env.DISCORD_WEBHOOK_ICON_URL,
        },
    });
    await webhook.notice.send('', [embed]);
    process.exit(0);
})();
