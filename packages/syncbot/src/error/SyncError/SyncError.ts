import { ErrorLogEntity } from '@opize/calendar2notion-object';

/**
 * SyncError는 동기화 과정에서 발생한 에러를 표현하는 클래스입니다.
 */
export class SyncError extends Error {
    code: ErrorLogEntity['code'];
    from: ErrorLogEntity['from'];
    description: ErrorLogEntity['description'];
    detail: ErrorLogEntity['detail'];
    user: ErrorLogEntity['user'];
    finishWork: ErrorLogEntity['finishWork'];
    level: ErrorLogEntity['level'];
    archive: ErrorLogEntity['archive'];

    constructor(data: {
        code: ErrorLogEntity['code'];
        from: ErrorLogEntity['from'];
        description: ErrorLogEntity['description'];
        detail: ErrorLogEntity['detail'];
        user: ErrorLogEntity['user'];
        finishWork?: ErrorLogEntity['finishWork'];
        level?: ErrorLogEntity['level'];
        archive?: ErrorLogEntity['archive'];
    }) {
        super(data.description);
        this.code = data.code;
        this.from = data.from;
        this.description = data.description;
        this.detail = data.detail;
        this.user = data.user;
        this.finishWork = data.finishWork || 'STOP';
        this.level = data.level || 'ERROR';
        this.archive = data.archive || false;
    }

    getErrorLogEntity() {
        return ErrorLogEntity.create({
            code: this.code,
            from: this.from,
            description: this.description,
            detail: this.detail,
            user: this.user,
            finishWork: this.finishWork,
            level: this.level,
            archive: this.archive,
            stack: this.stack,
        });
    }
}
