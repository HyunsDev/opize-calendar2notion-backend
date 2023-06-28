import { UserEntity } from '@opize/calendar2notion-model';
import { GaxiosError } from 'googleapis-common';

import { valueof } from '../../utils/valueOf';

import { SyncError } from './error';
import { SyncErrorCode } from './errorCode';

interface ErrorProps {
    code: valueof<typeof SyncErrorCode.GoogleCalendar>;
    user: UserEntity;
    err?: GaxiosError;
}

const ErrorMap: {
    [key in valueof<typeof SyncErrorCode.GoogleCalendar>]: {
        message: string;
        finishWork?: 'RETRY' | 'STOP';
    };
} = {
    [SyncErrorCode.GoogleCalendar.INVALID_REQUEST]: {
        message: '구글 캘린더 API 호출 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.INVALID_CREDENTIALS]: {
        message: '구글 캘린더 API 인증 오류',
        finishWork: 'STOP',
    },
    [SyncErrorCode.GoogleCalendar.RATE_LIMIT]: {
        message: '구글 캘린더 API 유저 호출 제한',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.USER_CALENDAR_USAGE_LIMIT]: {
        message: '구글 캘린더 API 유저 캘린더 사용량 초과',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.FORBIDDEN]: {
        message: '구글 캘린더 API FORBIDDEN',
        finishWork: 'STOP',
    },
    [SyncErrorCode.GoogleCalendar.NOT_FOUND]: {
        message: '구글 캘린더 API NOT_FOUND',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.GONE_UPDATED_MIN_TOO_LONG_AGO]: {
        message: '구글 캘린더 API 너무 오랜시간 동기화 되지 않음',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.GONE]: {
        message: '구글 캘린더 API GONE',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.INTERNAL_SERVER_ERROR]: {
        message: '구글 캘린더 API 서버 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.UNKNOWN_ERROR]: {
        message: '구글 캘린더 API 알 수 없는 오류',
        finishWork: 'RETRY',
    },
    [SyncErrorCode.GoogleCalendar.RATE_LIMIT]: {
        message: '구글 캘린더 API RATE_LIMIT (사용되지 않는 에러)',
        finishWork: 'RETRY',
    },
};

export class GoogleCalendarSyncError extends SyncError {
    constructor(props: ErrorProps) {
        super({
            code: props.code,
            description: `${ErrorMap[props.code].message} - ${
                props?.err?.response?.status
            }`,
            user: props.user,
            from: 'GOOGLE CALENDAR',
            detail: JSON.stringify({
                response: {
                    body: props?.err?.response.data,
                    status: props?.err?.response.status,
                },
                request: {
                    body: props?.err?.response.config.body,
                    url: props?.err?.response.config.url,
                    method: props?.err?.response.config.method,
                    data: props?.err?.response.config.data,
                    params: props?.err?.response.config.params,
                },
            }),
        });
    }
}
