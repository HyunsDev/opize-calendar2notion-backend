import { ErrorLogEntity } from '@opize/calendar2notion-object';

import { DB } from '@/database';
import { webhook } from '@/logger/webhook';
import { SyncError } from '../error/error';
import { WorkContext } from '../context/work.context';
import {
    getSyncFailEmbed,
    getUnknownSyncFailEmbed,
} from '../logger/discord/embeds';

export const isSyncError = (err: unknown): err is SyncError => {
    return err instanceof SyncError;
};

export const syncErrorFilter = async (context: WorkContext, err: SyncError) => {
    await DB.user.update(context.user.id, {
        isConnected: err.finishWork === 'STOP' ? false : true,
        lastSyncStatus: err.code || 'unknown_error',
    });

    const errorLog = await DB.errorLog.save(err.getErrorLog());

    const embed = getSyncFailEmbed(context.user, errorLog, err);
    await webhook.error.send('', [embed]);
};

export const unknownErrorFilter = async (
    context: WorkContext,
    err: SyncError,
) => {
    await DB.user.update(context.user.id, {
        lastSyncStatus: err.code || 'unknown_error',
    });

    const errorLog = await DB.errorLog.save(
        ErrorLogEntity.create({
            code: 'unknown_error',
            from: 'UNKNOWN',
            description: '알 수 없는 오류',
            detail: err.message,
            level: 'CRIT',
            archive: true,
            user: context.user,
            stack: err.stack,
            finishWork: 'STOP',
        }),
    );

    const embed = getUnknownSyncFailEmbed(context.user, errorLog, err);
    await webhook.error.send('', [embed]);
};
