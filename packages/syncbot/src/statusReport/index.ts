import { Embed } from '@hyunsdev/discord-webhook';
import { managerStorage } from '../manager/storage';
import { webhook } from '../logger/webhook';
import { ENV } from '../../src/env/env';

export class StatusReporter {
    public async startLoop() {
        await this.startReport();
        setInterval(async () => {
            await this.report();
        }, 1000 * 60 * 60 * 60);
    }

    public async startReport() {
        const embed = new Embed({
            title: '동기화봇 시작',
            color: 0x49bfa8,
            description: `**${process.env.SYNCBOT_PREFIX}**가 시작되었습니다.`,
            fields: [
                {
                    name: '시작 시간',
                    value: managerStorage.getItem('startedAt').toISOString(),
                },
                {
                    name: '워커 (init / pro / free / sponsor)',
                    value: `${managerStorage.getItem('workerAmount').init} / ${
                        managerStorage.getItem('workerAmount').pro
                    } / ${managerStorage.getItem('workerAmount').free} / ${
                        managerStorage.getItem('workerAmount').sponsor
                    }`,
                },
            ],
            footer: {
                text: `Calendar2notion v${managerStorage.getItem('verizon')}`,
                icon_url: ENV.DISCORD_WEBHOOK_ICON_URL,
            },
            timestamp: new Date().toISOString(),
        });

        await webhook.notice.send('', [embed]);
    }

    public async report() {
        const embed = new Embed({
            title: 'Status Report',
            color: 0x00ff00,
            description: `**${process.env.SYNCBOT_PREFIX}**의 상태를 알려드립니다.`,
            fields: [
                {
                    name: '24시간 동기화 (동기화 / 초기화 / 성공 / 실패)',
                    value: `${managerStorage.getItem('notice').syncCount} / ${
                        managerStorage.getItem('notice').initCount
                    } / ${
                        managerStorage.getItem('notice').successfulSyncCount
                    } / ${managerStorage.getItem('notice').failedSyncCount}`,
                },
            ],

            footer: {
                text: `Calendar2notion v${managerStorage.getItem('verizon')}`,
                icon_url: ENV.DISCORD_WEBHOOK_ICON_URL,
            },
            timestamp: new Date().toISOString(),
        });

        managerStorage.data.notice = {
            initCount: 0,
            syncCount: 0,
            successfulSyncCount: 0,
            failedSyncCount: 0,
            startedAt: new Date().toISOString(),
        };
        await webhook.notice.send('', [embed]);
    }
}

export const statusReporter = new StatusReporter();
