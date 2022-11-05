import { UserEntity } from '@opize/calendar2notion-model';
import { Worker } from '../../worker';
import { DB, AppDataSource } from '../../database';
import { timeout } from '../../utils/timeout';
import { managerStorage } from '../storage';
import { sleep } from '../../utils';
import dayjs from 'dayjs';
import { LessThan } from 'typeorm';
import { runnerLogger } from '../../logger';

export class Runner {
    public async run() {
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
                        this.loop(
                            plan as any,
                            `${process.env.SYNCBOT_PREFIX}_worker_${plan}_${i}`,
                        ),
                    ),
            );
        }
        await Promise.allSettled(promises);
        if (managerStorage.data.work) {
            runnerLogger.info(
                `[Runner] 모든 루프가 정상적으로 종료되었습니다.`,
            );
        } else {
            runnerLogger.error(
                `[Runner] 모든 루프가 종료 신호 없이 종료되었습니다.`,
            );
        }

        await AppDataSource.destroy();
        runnerLogger.info(
            `[Runner] DB 커넥션을 해제했습니다. 서버를 종료합니다.`,
        );
        process.exit(0);
    }

    private async loop(plan: UserEntity['userPlan'], loopId: string) {
        managerStorage.data.work[loopId] = {
            loopId: loopId,
            nowWorkUserId: undefined,
            completedSyncCount: 0,
        };
        runnerLogger.info(`[${loopId}] 루프를 시작합니다.`);
        while (true) {
            if (managerStorage.getItem('stop')) {
                runnerLogger.info(`[${loopId}] 루프를 종료합니다.`);
                break;
            }
            const user = await this.getTargetUser(plan);
            if (!user) {
                await sleep(5000);
                continue;
            }
            managerStorage.data.work[loopId].nowWorkUserId = user.id;
            await this.runWorker(user, loopId);
            managerStorage.data.work[loopId].completedSyncCount += 1;
            managerStorage.data.work[loopId].nowWorkUserId = undefined;
        }
    }

    private async getTargetUser(plan: UserEntity['userPlan']) {
        const user = await DB.user.findOne({
            where: {
                isWork: false,
                isConnected: true,
                userPlan: plan,
                lastCalendarSync: LessThan(dayjs().add(-1, 'm').toDate()),
            },
            order: {
                lastCalendarSync: {
                    direction: 'asc',
                },
            },
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
            const res = await worker.run();
            if (res.fail) {
                runnerLogger.info(
                    `[${loopId}:${user.id}] 동기화 실패 <${res.simpleResponse}>`,
                );
            } else {
                runnerLogger.info(
                    `[${loopId}:${user.id}] 동기화 완료 <${res.simpleResponse}>`,
                );
            }
            return res;
        };

        const run = async () => {
            try {
                return await timeout(func(), 1000 * 60 * 30);
            } catch (err) {
                if (err instanceof Error && err.message === 'timeout') {
                    runnerLogger.error(`[${loopId}:${user.id}] 타임아웃`);
                } else {
                    runnerLogger.error(
                        `[${loopId}:${user.id}] 알 수 없는 오류.\n[알 수 없는 오류 디버그 보고서]\n메세지: ${err.message}\n스택: ${err.stack}`,
                    );
                }
            }
        };

        const res = await run();
        return res;
    }
}
