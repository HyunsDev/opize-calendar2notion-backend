import { SyncError } from '../SyncError/SyncError';

/**
 * APIError는 동기화 과정 중 API 호출과 관련해서 발생한 에러를 표현하는 클래스입니다.
 * @see {@link SyncError}를 상속합니다.
 */
export class APIError extends SyncError {
    constructor(data: {
        code: SyncError['code'];
        from: SyncError['from'];
        description: SyncError['description'];
        detail: SyncError['detail'];
        user: SyncError['user'];
        finishWork?: SyncError['finishWork'];
        level?: SyncError['level'];
        archive?: SyncError['archive'];
    }) {
        super(data);
    }
}
