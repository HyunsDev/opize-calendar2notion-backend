import { sleep } from '../../../utils';
import { SyncError } from '../../error/error';
import { GaxiosError } from 'googleapis-common';
import { DB } from '../../../database';
import { UserEntity } from '@opize/calendar2notion-model';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
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
                        throw new SyncError({
                            code: 'gcal_api_invalid_request',
                            from: 'GOOGLE CALENDAR',
                            archive: true,
                            description: '구글 캘린더 API 호출 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    if (err.response.status === 401) {
                        throw new SyncError({
                            code: 'gcal_api_invalid_credentials',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 인증 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    if (err.response.status === 403) {
                        if (
                            err.response.data.message ===
                            'User Rate Limit Exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_user_rate_limit_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description: '구글 캘린더 과도한 유저 요청',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify({
                                    response: {
                                        body: err.response.data,
                                        status: err.response.status,
                                    },
                                    request: {
                                        body: err.response.config.body,
                                        url: err.response.config.url,
                                        method: err.response.config.method,
                                        data: err.response.config.data,
                                        params: err.response.config.params,
                                    },
                                }),
                            });
                        }
                        if (
                            err.response.data.message === 'Rate Limit Exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_rate_limit_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description: '구글 캘린더 과도한 요청',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify({
                                    response: {
                                        body: err.response.data,
                                        status: err.response.status,
                                    },
                                    request: {
                                        body: err.response.config.body,
                                        url: err.response.config.url,
                                        method: err.response.config.method,
                                        data: err.response.config.data,
                                        params: err.response.config.params,
                                    },
                                }),
                            });
                        }
                        if (
                            err.response.data.message ===
                                'Calendar usage limits exceeded.' ||
                            err.response.data.message ===
                                'Calendar usage limits exceeded'
                        ) {
                            throw new SyncError({
                                code: 'gcal_api_user_calendar_usage_limits_exceeded',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description:
                                    '구글 캘린더 유저 캘린더 사용한도 초과',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify({
                                    response: {
                                        body: err.response.data,
                                        status: err.response.status,
                                    },
                                    request: {
                                        body: err.response.config.body,
                                        url: err.response.config.url,
                                        method: err.response.config.method,
                                        data: err.response.config.data,
                                        params: err.response.config.params,
                                    },
                                }),
                            });
                        }

                        throw new SyncError({
                            code: 'gcal_api_forbidden',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 권한 없는 수정',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    if (err.response.status === 404) {
                        throw new SyncError({
                            code: 'gcal_api_not_found',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description:
                                '구글 리소스(캘린더, 이벤트)를 찾을 수 없음',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'STOP',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    if (err.response.status === 410) {
                        if (
                            err.response.data.error.errors[0].reason ===
                            'deleted'
                        ) {
                            return;
                            // TODO: #27 현재 해당 오류에 대한 원인 파악 필요함
                            // throw new SyncError({
                            //     code: 'gcal_api_gone_deleted',
                            //     from: 'GOOGLE CALENDAR',
                            //     archive: false,
                            //     description: '구글 캘린더 이벤트가 삭제됨',
                            //     level: 'ERROR',
                            //     showUser: true,
                            //     user: this.user,
                            //     guideUrl: '',
                            //     finishWork: 'STOP',
                            //     detail: JSON.stringify({
                            //         response: {
                            //             body: err.response.data,
                            //             status: err.response.status,
                            //         },
                            //         request: {
                            //             body: err.response.config.body,
                            //             url: err.response.config.url,
                            //             method: err.response.config.method,
                            //             data: err.response.config.data,
                            //             params: err.response.config.params,
                            //         },
                            //     }),
                            // });
                        } else if (
                            err.response.data.error.errors[0].reason ===
                            'updatedMinTooLongAgo'
                        ) {
                            await DB.user.update(this.user, {
                                lastCalendarSync: dayjs()
                                    .tz(
                                        (this.user as UserEntity)
                                            .userTimeZone || 'Asia/Seoul',
                                    )
                                    .add(+10, 'days')
                                    .toDate(),
                            });

                            console.log('함수 이름', key);

                            throw new SyncError({
                                code: 'gcal_api_gone_updated_min_too_long_ago',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description:
                                    'updatedMin을 사용할 수 없음 (너무 오랬동안 동기화 되지 않음) - 동기화 시간 초기화 함',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify({
                                    response: {
                                        body: err.response.data,
                                        status: err.response.status,
                                    },
                                    request: {
                                        body: err.response.config.body,
                                        url: err.response.config.url,
                                        method: err.response.config.method,
                                        data: err.response.config.data,
                                        params: err.response.config.params,
                                    },
                                }),
                            });
                        } else {
                            throw new SyncError({
                                code: 'gcal_api_gone',
                                from: 'GOOGLE CALENDAR',
                                archive: false,
                                description: '구글 캘린더 API Gone (원인 불명)',
                                level: 'ERROR',
                                showUser: true,
                                user: this.user,
                                guideUrl: '',
                                finishWork: 'RETRY',
                                detail: JSON.stringify({
                                    response: {
                                        body: err.response.data,
                                        status: err.response.status,
                                    },
                                    request: {
                                        body: err.response.config.body,
                                        url: err.response.config.url,
                                        method: err.response.config.method,
                                        data: err.response.config.data,
                                        params: err.response.config.params,
                                    },
                                }),
                            });
                        }
                    }

                    if (err.response.status === 429) {
                        throw new SyncError({
                            code: 'gcal_api_rate_limit_exceeded',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 과도한 요청',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    if (err.response.status === 500) {
                        throw new SyncError({
                            code: 'gcal_api_backend_error',
                            from: 'GOOGLE CALENDAR',
                            archive: false,
                            description: '구글 캘린더 API 서버 오류',
                            level: 'ERROR',
                            showUser: true,
                            user: this.user,
                            guideUrl: '',
                            finishWork: 'RETRY',
                            detail: JSON.stringify({
                                response: {
                                    body: err.response.data,
                                    status: err.response.status,
                                },
                                request: {
                                    body: err.response.config.body,
                                    url: err.response.config.url,
                                    method: err.response.config.method,
                                    data: err.response.config.data,
                                    params: err.response.config.params,
                                },
                            }),
                        });
                    }

                    throw new SyncError({
                        code: 'gcal_api_unknown_error',
                        from: 'GOOGLE CALENDAR',
                        archive: false,
                        description: '구글 캘린더 API 알 수 없는 오류',
                        level: 'ERROR',
                        showUser: true,
                        user: this.user,
                        guideUrl: '',
                        finishWork: 'STOP',
                        detail: JSON.stringify({
                            response: {
                                body: err.response.data,
                                status: err.response.status,
                            },
                            request: {
                                body: err.response.config.body,
                                url: err.response.config.url,
                                method: err.response.config.method,
                                data: err.response.config.data,
                                params: err.response.config.params,
                            },
                        }),
                    });
                } else {
                    throw err;
                }
            }
        };
    };
}
