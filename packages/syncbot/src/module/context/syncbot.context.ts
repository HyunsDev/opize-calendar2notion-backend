import { env } from '@/env/env';

export class SyncBotContext {
    readonly prefix: string;
    readonly startedAt: Date;
    readonly version: string;
    readonly workerAmount: {
        init: number;
        pro: number;
        free: number;
        sponsor: number;
    };

    timeout: number;
    stop: boolean;

    constructor() {
        this.prefix = env.SYNCBOT_PREFIX;
        this.startedAt = new Date();
        this.version = process.env.npm_package_version;
        this.workerAmount = {
            init: 2,
            pro: 2,
            free: 2,
            sponsor: 2,
        };
        this.timeout = 1000 * 60 * 60;
        this.stop = false;
    }
}
