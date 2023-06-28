import { APIResponseError } from '@notionhq/client';
import { UserEntity } from '@opize/calendar2notion-model';

import { valueof } from '../../utils/valueOf';

import { SyncError } from './error';
import { SyncErrorCode } from './errorCode';

interface ErrorProps {
    code: valueof<typeof SyncErrorCode.Notion>;
    user: UserEntity;
    err?: APIResponseError;
}

const ErrorMap: {
    [key in valueof<typeof SyncErrorCode.Notion>]: {
        message: string;
        finishWork?: 'RETRY' | 'STOP';
    };
} = {
    [SyncErrorCode.Notion.INVALID_REQUEST]: {
        message: '노션 API 잘못된 요청',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.DATABASE_NOT_FOUND]: {
        message: '노션 API 데이터베이스를 찾을 수 없음',
        finishWork: 'STOP',
    },
    [SyncErrorCode.Notion.PAGE_NOT_FOUND]: {
        message: '노션 API 페이지를 찾을 수 없음',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.RATE_LIMIT]: {
        message: '노션 API 과도한 요청',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.UNAUTHORIZED]: {
        message: '노션 API 인증 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.CONFLICT_ERROR]: {
        message: '노션 API 트랜젝션 충돌',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.INTERNAL_SERVER_ERROR]: {
        message: '노션 API 서버 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.Notion.SERVICE_UNAVAILABLE]: {
        message: '노션 API 서버 오류',
        finishWork: 'RETRY',
    },
};

export class NotionSyncError extends SyncError {
    constructor(props: ErrorProps) {
        super({
            code: props.code,
            description: ErrorMap[props.code].message,
            finishWork: ErrorMap[props.code].finishWork,
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
