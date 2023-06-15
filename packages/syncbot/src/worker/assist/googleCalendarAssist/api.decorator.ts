import { sleep } from '../../../utils';
import { GaxiosError } from 'googleapis-common';
import { DB } from '../../../database';
import { UserEntity } from '@opize/calendar2notion-model';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { GoogleCalendarSyncError, GoogleCalendarSyncErrorCode } from './error';
dayjs.extend(utc);
dayjs.extend(timezone);

export function gCalApi() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const method = desc.value;
        desc.value = async function (...e: any) {
            try {
                await sleep(400); // API RATE LIMIT 방지를 위한 SLEEP
                let retriesCount = 3;
                while (true) {
                    try {
                        retriesCount -= 1;
                        return await method.apply(this, e);
                    } catch (err) {
                        if (retriesCount === 0) throw err;
                        await sleep(1000);
                    }
                }
            } catch (err: unknown) {
                if (err instanceof GaxiosError) {
                    console.log(err);

                    if (err.response.status === 400) {
                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.INVALID_REQUEST,
                            description: '구글 캘린더 API 호출 오류',
                            user: this.user,
                            detail: err,
                        });
                    }

                    if (err.response.status === 401) {
                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.INVALID_CREDENTIALS,
                            description: '구글 캘린더 인증 오류',
                            user: this.user,
                            detail: err,
                        });
                    }

                    if (err.response.status === 403) {
                        if (
                            err.response.data.message ===
                            'User Rate Limit Exceeded'
                        ) {
                            throw new GoogleCalendarSyncError({
                                code: GoogleCalendarSyncErrorCode.USER_RATE_LIMIT,
                                description: '구글 캘린더 과도한 유저 요청',
                                archive: false,
                                user: this.user,
                                finishWork: 'RETRY',
                                detail: err,
                            });
                        }
                        if (
                            err.response.data.message === 'Rate Limit Exceeded'
                        ) {
                            throw new GoogleCalendarSyncError({
                                code: GoogleCalendarSyncErrorCode.RATE_LIMIT,
                                archive: false,
                                description: '구글 캘린더 과도한 요청',
                                user: this.user,
                                finishWork: 'RETRY',
                                detail: err,
                            });
                        }
                        if (
                            err.response.data.message ===
                                'Calendar usage limits exceeded.' ||
                            err.response.data.message ===
                                'Calendar usage limits exceeded'
                        ) {
                            throw new GoogleCalendarSyncError({
                                code: GoogleCalendarSyncErrorCode.USER_CALENDAR_USAGE_LIMIT,
                                archive: false,
                                description:
                                    '구글 캘린더 유저 캘린더 사용한도 초과',
                                user: this.user,
                                finishWork: 'RETRY',
                                detail: err,
                            });
                        }

                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.FORBIDDEN,
                            archive: false,
                            description: '구글 캘린더 권한 없는 수정',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: err,
                        });
                    }

                    if (err.response.status === 404) {
                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.NOT_FOUND,
                            archive: false,
                            description:
                                '구글 리소스(캘린더, 이벤트)를 찾을 수 없음',
                            user: this.user,
                            finishWork: 'STOP',
                            detail: err,
                        });
                    }

                    if (err.response.status === 410) {
                        if (
                            err.response.data.error.errors[0].reason ===
                            'deleted'
                        ) {
                            return;
                        } else if (
                            err.response.data.error.errors[0].reason ===
                            'updatedMinTooLongAgo'
                        ) {
                            const newDate = dayjs()
                                .tz(
                                    (this.user as UserEntity).userTimeZone ||
                                        'Asia/Seoul',
                                )
                                .add(-10, 'days')
                                .toDate();

                            await DB.user.update(this.user, {
                                lastCalendarSync: newDate,
                            });

                            throw new GoogleCalendarSyncError({
                                code: GoogleCalendarSyncErrorCode.GONE_UPDATED_MIN_TOO_LONG_AGO,
                                archive: false,
                                description: `updatedMin을 사용할 수 없음 (너무 오랬동안 동기화 되지 않음) - 동기화 시간 초기화 함 ${newDate.toISOString()}`,
                                level: 'ERROR',
                                user: this.user,
                                finishWork: 'RETRY',
                                detail: err,
                            });
                        } else {
                            throw new GoogleCalendarSyncError({
                                code: GoogleCalendarSyncErrorCode.GONE,
                                archive: false,
                                description: '구글 캘린더 API Gone (원인 불명)',
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: err,
                            });
                        }
                    }

                    if (err.response.status === 429) {
                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.RATE_LIMIT,
                            archive: false,
                            description: '구글 캘린더 과도한 요청',
                            user: this.user,
                            finishWork: 'RETRY',
                            detail: err,
                        });
                    }

                    if (err.response.status === 500) {
                        throw new GoogleCalendarSyncError({
                            code: GoogleCalendarSyncErrorCode.INTERNAL_SERVER_ERROR,
                            description: '구글 캘린더 API 서버 오류',
                            level: 'ERROR',
                            user: this.user,
                            finishWork: 'RETRY',
                            detail: err,
                        });
                    }

                    throw new GoogleCalendarSyncError({
                        code: GoogleCalendarSyncErrorCode.UNKNOWN_ERROR,
                        archive: false,
                        description: '구글 캘린더 API 알 수 없는 오류',
                        user: this.user,
                        detail: err,
                    });
                } else {
                    throw err;
                }
            }
        };
    };
}
