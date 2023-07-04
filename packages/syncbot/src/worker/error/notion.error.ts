import { APIResponseError } from '@notionhq/client';
import { UserEntity } from '@opize/calendar2notion-model';

import { valueof } from '../../utils/valueOf';

import { SyncError } from './error';
import { SyncErrorCode } from './errorCode';

interface APIErrorProps {
    code: valueof<typeof SyncErrorCode.notion.api>;
    user: UserEntity;
    err?: APIResponseError;
}

const APIErrorMap: {
    [key in valueof<typeof SyncErrorCode.notion.api>]: {
        message: string;
        finishWork?: 'RETRY' | 'STOP';
    };
} = {
    [SyncErrorCode.notion.api.INVALID_REQUEST]: {
        message: '노션 API 잘못된 요청',
        finishWork: 'STOP',
    },
    [SyncErrorCode.notion.api.DATABASE_NOT_FOUND]: {
        message: '노션 API 데이터베이스를 찾을 수 없음',
        finishWork: 'STOP',
    },
    [SyncErrorCode.notion.api.PAGE_NOT_FOUND]: {
        message: '노션 API 페이지를 찾을 수 없음',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.notion.api.RATE_LIMIT]: {
        message: '노션 API 과도한 요청',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.notion.api.UNAUTHORIZED]: {
        message: '노션 API 인증 오류',
        finishWork: 'STOP',
    },
    [SyncErrorCode.notion.api.CONFLICT_ERROR]: {
        message: '노션 API 트랜젝션 충돌',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.notion.api.INTERNAL_SERVER_ERROR]: {
        message: '노션 API 서버 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.notion.api.SERVICE_UNAVAILABLE]: {
        message: '노션 API 서버 오류',
        finishWork: 'RETRY',
    },
};

export class NotionAPIError extends SyncError {
    constructor(props: APIErrorProps) {
        super({
            code: props.code,
            description: APIErrorMap[props.code].message,
            finishWork: APIErrorMap[props.code].finishWork,
            user: props.user,
            from: 'NOTION',
            detail: JSON.stringify({
                body: props?.err?.body,
                status: props?.err?.status,
                code: props?.err?.code,
            }),
        });
    }
}

interface SyncErrorProps {
    code: valueof<typeof SyncErrorCode.notion.api>;
    user: UserEntity;
    detail?: string;
}

const SyncErrorMap: {
    [key in valueof<typeof SyncErrorCode.notion.sync>]: {
        message: string;
        finishWork?: 'RETRY' | 'STOP';
    };
} = {
    [SyncErrorCode.notion.sync.VALIDATION_ERROR]: {
        message: '노션 동기화 유효성 검사 오류',
        finishWork: 'STOP',
    },
};

export class NotionSyncError extends SyncError {
    constructor(props: SyncErrorProps) {
        super({
            code: props.code,
            description: SyncErrorMap[props.code].message,
            finishWork: SyncErrorMap[props.code].finishWork,
            user: props.user,
            from: 'NOTION',
            detail: props.detail,
        });
    }
}
