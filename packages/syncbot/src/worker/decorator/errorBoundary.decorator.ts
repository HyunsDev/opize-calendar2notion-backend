import { ErrorLogEntity } from '@opize/calendar2notion-model';
import { DB } from '../../database';
import { SyncError } from '../error/error';
import { syncLogger } from '../logger';

export function SyncErrorBoundary(boundaryName: string) {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            try {
                return await method.apply(this, e);
            } catch (err: unknown) {
                if (err instanceof SyncError) {
                    if (err.isReported) throw err;

                    syncLogger.write(
                        err.from,
                        `[${err.code}] ${err.description}`,
                        'error',
                    );

                    // SyncError 처리
                    const errorLog = new ErrorLogEntity();
                    errorLog.code = err.code;
                    errorLog.from = err.from;
                    errorLog.description = err.description;
                    errorLog.detail = `${boundaryName}\n` + err.detail;
                    errorLog.showUser = err.showUser;
                    errorLog.guideUrl = err.guideUrl;
                    errorLog.knownError = err.knownError;
                    errorLog.level = err.level;
                    errorLog.archive = err.archive;
                    errorLog.user = this.user;
                    errorLog.stack = err.stack;
                    errorLog.finishWork = err.finishWork;
                    await DB.errorLog.save(errorLog);

                    err.isReported = true;
                    throw err;
                } else {
                    throw err;
                }
            }
        };
    };
}
