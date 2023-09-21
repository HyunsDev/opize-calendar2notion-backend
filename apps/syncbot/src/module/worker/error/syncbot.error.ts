import { UserEntity } from '@opize/calendar2notion-object';

import { SyncError } from './error';

interface TimeoutErrorProps {
    user: UserEntity;
}

export class SyncTimeoutError extends SyncError {
    constructor(props: TimeoutErrorProps) {
        super({
            code: 'TIMEOUT',
            description: '동기화 시간 초과',
            finishWork: 'RETRY',
            from: 'SYNCBOT',
            user: props.user,
        });
    }
}
