import chalk from 'chalk';
import { UserEntity } from '@opize/calendar2notion-model';
import { DB } from '../../database';

type LogFrom = 'GOOGLE CALENDAR' | 'NOTION' | 'SYNCBOT' | 'COMPLEX' | 'UNKNOWN';
type LogLevel = 'debug' | 'info' | 'notice' | 'warn' | 'error' | 'crit';

const logLevel: Record<LogLevel, number> = {
    debug: 20,
    info: 40,
    notice: 60,
    warn: 80,
    error: 100,
    crit: 120,
};

const logColorMap: Record<LogLevel, string> = {
    debug: 'cyan',
    info: 'green',
    notice: 'blue',
    warn: 'yellow',
    error: 'red',
    crit: 'red',
};

export class SyncLogger {
    private user: UserEntity;
    private showConsole: boolean;
    level: LogLevel;

    log: {
        from: LogFrom;
        created: string;
        message: string;
        level: LogLevel;
    }[];

    constructor(
        option: {
            showConsole?: boolean;
            level?: LogLevel;
        } = {
            showConsole: false,
            level: 'info',
        },
    ) {
        this.showConsole = option.showConsole;
        this.level = option.level;
    }

    public async init(user: UserEntity) {
        this.user = user;
        this.log = [];
        const syncLog: any = {};
        syncLog.detail = '';
        syncLog.status = 'WORKING';
        syncLog.user = this.user;
        this.syncLog = await DB.syncLog.save(syncLog);
    }

    public async push() {
        this.syncLog.detail = JSON.stringify(this.log);
        await DB.syncLog.save(this.syncLog);
    }

    public async statusUpdate(
        status: 'SUCCESS' | 'FAIL' | 'WORKING' | 'CANCELED',
    ) {
        this.syncLog.status = status;
    }

    write(from: LogFrom, message: string, level: LogLevel = 'info') {
        if (logLevel[level] < logLevel[this.level]) return;
        if (this.showConsole) {
            console.log(
                `${chalk[logColorMap[level]](level)} ${chalk.gray(
                    from,
                )}: ${message}`,
            );
        }
        this.log.push({
            created: new Date().toISOString(),
            from,
            message,
            level,
        });
    }
}

let nowLogLevel: LogLevel;
switch (process.env.NODE_ENV) {
    case 'development':
        nowLogLevel = 'debug';
        break;
    case 'test':
        nowLogLevel = 'notice';
        break;
    default:
        nowLogLevel = 'info';
}

export const syncLogger = new SyncLogger({
    showConsole: true,
    level: nowLogLevel,
});
