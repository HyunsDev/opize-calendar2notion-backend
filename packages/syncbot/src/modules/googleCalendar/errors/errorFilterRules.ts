import { GaxiosResponse } from 'googleapis-common';

import { SyncContext } from '@/contexts/sync.context';

import { GoogleCalendarAPIError } from './GoogleCalendarAPIError';

export type GoogleCalendarErrorFilterRule = {
    /**
     * 에러 필터의 이름입니다. 일반적으로 에러의 code와 동일한 이름을 사용하지만 다른 이름을 사용할 수도 있습니다.
     */
    name: string;
    /**
     * 에러 필터가 적용될 조건을 지정합니다. 만약 2개 이상의 에러 필터가 적용될 수 있는 경우, 가장 먼저 조건을 만족하는 에러 필터가 적용됩니다.
     */
    condition: (response: GaxiosResponse) => boolean;
    callback?: (error: any, context: SyncContext, args: any[]) => Promise<any>;
};

export const baseErrorFilterRules: GoogleCalendarErrorFilterRule[] = [
    {
        name: 'NO_RESPONSE',
        condition: ({ status }) => status === undefined,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'NO_RESPONSE',
                description: '구글 캘린더 API 응답 없음',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'INVALID_REQUEST',
        condition: ({ status }) => status === 400,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'INVALID_REQUEST',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'INVALID_CREDENTIALS',
        condition: ({ status }) => status === 401,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'INVALID_CREDENTIALS',
                description: '구글 캘린더 API 인증 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'RATE_LIMIT',
        condition: ({ status, data }) =>
            status === 403 &&
            ['User Rate Limit Exceeded', 'Rate Limit Exceeded'].includes(
                data.message,
            ),
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'RATE_LIMIT',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'USER_CALENDAR_USAGE_LIMIT',
        condition: ({ data, status }) =>
            status === 403 &&
            [
                'Calendar usage limits exceeded.',
                'Calendar usage limits exceeded',
            ].includes(data.message),
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'USER_CALENDAR_USAGE_LIMIT',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'FORBIDDEN',
        condition: ({ status }) => status === 403,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'FORBIDDEN',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'NOT_FOUND',
        condition: ({ status }) => status === 404,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'NOT_FOUND',
                description: '구글 캘린더 API NOT_FOUND',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'ALREADY_DELETED',
        condition: ({ status, data }) =>
            status === 410 && data.message === 'deleted',
    },
    {
        name: 'GONE_UPDATED_MIN_TOO_LONG_AGO',
        condition: ({ status, data }) =>
            status === 410 &&
            data.error.errors[0].reason === 'updatedMinTooLongAgo',
        callback: async (error, context, args) => {
            // TODO: 구글 캘린더 API 호출 오류 처리
            throw new GoogleCalendarAPIError({
                code: 'GONE_UPDATED_MIN_TOO_LONG_AGO',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'GONE',
        condition: ({ status }) => status === 410,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'GONE',
                description: '구글 캘린더 API 호출 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'INTERNAL_SERVER_ERROR',
        condition: ({ status }) => status === 500,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'INTERNAL_SERVER_ERROR',
                description: '구글 캘린더 API 서버 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
    {
        name: 'UNKNOWN_ERROR',
        condition: () => true,
        callback: async (error, context, args) => {
            throw new GoogleCalendarAPIError({
                code: 'UNKNOWN_ERROR',
                description: '구글 캘린더 API 알 수 없는 오류',
                finishWork: 'RETRY',

                response: error?.response,
                context,
                args,
            });
        },
    },
];
