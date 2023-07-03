import { ErrorLogEntity, UserEntity } from '@opize/calendar2notion-model';

type ErrorSyncConstructor = {
    code: ErrorLogEntity['code'];
    from: ErrorLogEntity['from'];
    description: ErrorLogEntity['description'];
    detail?: ErrorLogEntity['detail'];
    user: ErrorLogEntity['user'];
    finishWork?: ErrorLogEntity['finishWork'];
    level?: ErrorLogEntity['level'];
};

export class SyncError extends Error {
    code: ErrorLogEntity['code'];
    from: ErrorLogEntity['from'];
    description: ErrorLogEntity['description'];
    detail: ErrorLogEntity['detail'];
    user: ErrorLogEntity['user'];
    finishWork: ErrorLogEntity['finishWork'];
    level: ErrorLogEntity['level'];

    isReported: boolean;

    constructor({
        code,
        from,
        description,
        detail,
        finishWork = 'STOP',
        level = 'ERROR',
        user,
    }: ErrorSyncConstructor) {
        super(description);
        this.code = code;
        this.from = from;
        this.description = description;
        this.detail = detail;
        this.finishWork = finishWork;
        this.level = level;
        this.user = user;

        this.isReported = false;
    }

    getErrorLog(): ErrorLogEntity {
        return new ErrorLogEntity({
            code: this.code,
            from: this.from,
            description: this.description,
            detail: this.detail,
            finishWork: this.finishWork,
            user: this.user,
            archive: false,
            level: this.level,
            stack: this.stack,
        });
    }
}
