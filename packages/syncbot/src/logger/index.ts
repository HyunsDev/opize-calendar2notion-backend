import { loggerGenerator } from './generator';

export const runnerLogger = loggerGenerator('runner');
export const serverLogger = loggerGenerator('server');
export const workerLogger = loggerGenerator('worker');
