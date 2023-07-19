import { Embed } from '@hyunsdev/discord-webhook';
import { UserEntity } from '@opize/calendar2notion-object';
import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { IsNull, LessThan } from 'typeorm';

import { DB, AppDataSource } from '../../database';
import { runnerLogger } from '../../logger';
import { webhook } from '../../logger/webhook';
import { sleep } from '../../utils';
import { Worker } from '../../worker';
import { managerStorage } from '../storage';
dayjs.extend(utc);
dayjs.extend(timezone);

export class Runner {
    public async restoreWrongSync() {
        const res = await DB.user.update(
            {
                isWork: true,
                syncbotId: process.env.SYNCBOT_PREFIX,
            },
            {
                isWork: false,
            },
        );
        runnerLogger.info(
            `[Runner] 비정상적인 작업 ${res.affected}개를 초기화했습니다.`,
        );
    }

    public async run() {
        runnerLogger.info(
            `[Runner] ${process.env.SYNCBOT_PREFIX} Runner을 시작합니다`,
        );

        await this.restoreWrongSync();

        const promises: Promise<any>[] = [];
        runnerLogger.info(
            `[Runner] 루프를 시작합니다. ${JSON.stringify(
                managerStorage.getItem('workerAmount'),
            )}`,
        );

        for (const plan in managerStorage.getItem('workerAmount')) {
            const amount = managerStorage.getItem('workerAmount')[plan];
            promises.push(
                ...Array(amount)
                    .fill(0)
                    .map((_, i) =>
                        plan === 'init'
                            ? this.initUserLoop(
                                  `${process.env.SYNCBOT_PREFIX}_worker_${plan}_${i}`,
                              )
                            : this.planUserLoop(
                                  plan as any,
                                  `${process.env.SYNCBOT_PREFIX}_worker_${plan}_${i}`,
                              ),
                    ),
            );
        }
        await Promise.allSettled(promises);
        if (managerStorage.data.work) {
            runnerLogger.info(`[Runner] 모든 루프가 정상적으로 종료되었습니다`);
        } else {
            runnerLogger.error(
                `[Runner] 모든 루프가 종료 신호 없이 종료되었습니다`,
            );
        }

        await AppDataSource.destroy();
        runnerLogger.info(
            `[Runner] DB 커넥션을 해제했습니다. 서버를 종료합니다`,
        );

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
    }

    private async planUserLoop(plan: UserEntity['userPlan'], loopId: string) {
        managerStorage.data.work[loopId] = {
            loopId: loopId,
            nowWorkUserId: null,
            completedSyncCount: 0,
            startedAt: null,
        };
        runnerLogger.info(`[${loopId}] 루프 시작`);
        while (true) {
            if (managerStorage.getItem('stop')) {
                runnerLogger.info(`[${loopId}] 루프 종료`);
                break;
            }
            const user = await this.getTargetUser(plan);
            if (!user) {
                await sleep(5000);
                continue;
            }
            managerStorage.data.work[loopId].nowWorkUserId = user.id;
            managerStorage.data.work[loopId].startedAt =
                new Date().toISOString();
            await this.runWorker(user, loopId);
            managerStorage.data.work[loopId].completedSyncCount += 1;
            managerStorage.data.work[loopId].nowWorkUserId = null;
            managerStorage.data.work[loopId].startedAt = null;

            managerStorage.data.notice.syncCount += 1;
        }
    }

    private async initUserLoop(loopId: string) {
        managerStorage.data.work[loopId] = {
            loopId: loopId,
            nowWorkUserId: null,
            completedSyncCount: 0,
            startedAt: null,
        };
        runnerLogger.info(`[${loopId}] 루프 시작`);
        while (true) {
            if (managerStorage.getItem('stop')) {
                runnerLogger.info(`[${loopId}] 루프 종료`);
                break;
            }
            const user = await this.getTargetInitUser();
            if (!user) {
                await sleep(5000);
                continue;
            }
            managerStorage.data.work[loopId].nowWorkUserId = user.id;
            managerStorage.data.work[loopId].startedAt =
                new Date().toISOString();
            await this.runWorker(user, loopId);
            managerStorage.data.work[loopId].completedSyncCount += 1;
            managerStorage.data.work[loopId].nowWorkUserId = null;
            managerStorage.data.work[loopId].startedAt = null;

            managerStorage.data.notice.initCount += 1;
        }
    }

    private async getTargetUser(plan: UserEntity['userPlan']) {
        const user = await DB.user.findOne({
            where: {
                isWork: false,
                isConnected: true,
                userPlan: plan,
                lastCalendarSync: LessThan(
                    dayjs().tz('Asia/Seoul').add(-1, 'minute').toDate(),
                ),
            },
            order: {
                lastCalendarSync: {
                    direction: 'asc',
                },
            },
            relations: ['notionWorkspace'],
        });

        // 중복 실행 방지
        if (
            user &&
            Object.values(managerStorage.getItem('work'))
                .map((e) => e.nowWorkUserId)
                .includes(user.id)
        ) {
            return undefined;
        }

        return user;
    }

    private async getTargetInitUser() {
        const user = await DB.user.findOne({
            where: {
                isWork: false,
                isConnected: true,
                lastCalendarSync: IsNull(),
            },
            order: {},
        });

        // 중복 실행 방지
        if (
            user &&
            Object.values(managerStorage.getItem('work'))
                .map((e) => e.nowWorkUserId)
                .includes(user.id)
        ) {
            return undefined;
        }

        return user;
    }

    private async runWorker(user: UserEntity, loopId: string) {
        const func = async () => {
            const worker = new Worker(user.id, loopId);
            runnerLogger.info(
                `[${loopId}:${user.id}] 동기화 시작 <${user.id}. ${user.email}>`,
            );
            const res = await worker.run();
            if (res.fail) {
                runnerLogger.info(
                    `[${loopId}:${user.id}] 동기화 실패 <${res.simpleResponse}>`,
                );
                managerStorage.data.notice.failedSyncCount += 1;
            } else {
                runnerLogger.info(
                    `[${loopId}:${user.id}] 동기화 완료 <${res.simpleResponse}>`,
                );
                managerStorage.data.notice.successfulSyncCount += 1;
            }

            try {
                await axios.post(
                    `${process.env.SYNCBOT_BACKEND}/syncbot/stream/message`,
                    {
                        prefix: process.env.SYNCBOT_PREFIX,
                        data: {
                            prefix: process.env.SYNCBOT_PREFIX,
                            workerId: loopId,
                            userId: user.id,
                            result: res,
                            finishedAt: new Date().toISOString(),
                        },
                    },
                    {
                        headers: {
                            authorization: `Bearer ${process.env.SYNCBOT_CONTROL_SECRET}`,
                        },
                    },
                );
            } catch (err) {
                if (err.response) {
                    runnerLogger.warn(
                        `[${loopId}:${user.id}] API 서버가 오류를 반환함 ${err.response?.status}`,
                    );
                } else {
                    runnerLogger.warn(
                        `[${loopId}:${user.id}] API 서버에 연결할 수 없음`,
                    );
                }
            }

            return res;
        };

        const run = async () => {
            try {
                return await func();
            } catch (err) {
                runnerLogger.error(
                    `[${loopId}:${user.id}] 알 수 없는 오류.\n[알 수 없는 오류 디버그 보고서]\n메세지: ${err.message}\n스택: ${err.stack}`,
                );
            }
        };

        const res = await run();
        return res;
    }
}
