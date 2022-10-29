import { ErrorLogEntity } from '@opize/calendar2notion-model';

type ErrorSyncConstructor = {
    code: ErrorLogEntity['code'];
    from: ErrorLogEntity['from'];
    description: ErrorLogEntity['description'];
    detail?: ErrorLogEntity['detail'];
    showUser: ErrorLogEntity['showUser'];
    guideUrl?: ErrorLogEntity['guideUrl'];
    knownError?: ErrorLogEntity['knownError'];
    level: ErrorLogEntity['level'];
    archive: ErrorLogEntity['archive'];
    user: ErrorLogEntity['user'];
    finishWork: ErrorLogEntity['finishWork'];
};

export class SyncError extends Error {
    code: ErrorLogEntity['code'];
    from: ErrorLogEntity['from'];
    description: ErrorLogEntity['description'];
    detail: ErrorLogEntity['detail'];
    showUser: ErrorLogEntity['showUser'];
    guideUrl?: ErrorLogEntity['guideUrl'];
    knownError?: ErrorLogEntity['knownError'];
    level: ErrorLogEntity['level'];
    archive: ErrorLogEntity['archive'];
    user: ErrorLogEntity['user'];
    finishWork: ErrorLogEntity['finishWork'];

    isReported: boolean;

    constructor({
        code,
        from,
        description,
        detail,
        showUser,
        guideUrl,
        knownError,
        level,
        archive,
        finishWork,
    }: ErrorSyncConstructor) {
        super(description);
        this.code = code;
        this.from = from;
        this.description = description;
        this.detail = detail;
        this.showUser = showUser;
        this.guideUrl = guideUrl;
        this.knownError = knownError;
        this.level = level;
        this.archive = archive;
        this.finishWork = finishWork;
        this.isReported = false;
    }
}
